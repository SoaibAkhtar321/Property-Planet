-- supabase/tests/ai_search_rls.sql
--
-- Verifies the AI search / insights boundary added in
-- 0038_ai_search_and_insights.sql. Run against a scratch database with all
-- migrations applied:
--
--   psql "$DATABASE_URL" -f supabase/tests/ai_search_rls.sql
--
-- One transaction, ROLLED BACK at the end. Prints PASS/FAIL per check.
-- Requires a role that can SET ROLE anon/authenticated (e.g. postgres).

\set ON_ERROR_STOP off
\set QUIET on
begin;

create function zz_t(p_name text, p_ok boolean) returns void language plpgsql as $$
begin
  if p_ok then raise notice 'PASS  %', p_name; else raise notice 'FAIL  %', p_name; end if;
end $$;
grant execute on function zz_t(text, boolean) to public;

-- Runs p_sql as p_role (and user p_uid) and returns 'ok' or 'blocked: ...'.
create function zz_try(p_role text, p_uid uuid, p_sql text) returns text language plpgsql as $$
begin
  perform set_config('request.jwt.claim.sub', coalesce(p_uid::text, ''), true);
  execute format('set local role %I', p_role);
  begin
    execute p_sql;
  exception when others then
    execute 'reset role';
    return 'blocked: ' || sqlerrm;
  end;
  execute 'reset role';
  return 'ok';
end $$;

-- Like zz_try but returns an integer result of p_sql (a count), -1 if blocked.
create function zz_count(p_role text, p_uid uuid, p_sql text) returns bigint language plpgsql as $$
declare v bigint;
begin
  perform set_config('request.jwt.claim.sub', coalesce(p_uid::text, ''), true);
  execute format('set local role %I', p_role);
  begin
    execute p_sql into v;
  exception when others then
    execute 'reset role';
    return -1;
  end;
  execute 'reset role';
  return v;
end $$;

-- ------------------------------------------------------------------ seed
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000a1', 'sellerA@example.com'),
  ('00000000-0000-0000-0000-0000000000a2', 'sellerB@example.com'),
  ('00000000-0000-0000-0000-0000000000d1', 'admin@example.com');
update profiles set role = 'seller', phone = '+911111111111' where id = '00000000-0000-0000-0000-0000000000a1';
update profiles set role = 'seller', phone = '+912222222222' where id = '00000000-0000-0000-0000-0000000000a2';
update profiles set role = 'admin' where id = '00000000-0000-0000-0000-0000000000d1';

insert into properties (id, owner_id, title, slug, property_type, price, status, city, locality) values
  ('00000000-0000-0000-0000-00000000aa01', '00000000-0000-0000-0000-0000000000a1', 'Published plot', 'pub-plot', 'plot', 1000000, 'draft', 'Hyderabad', 'Shadnagar'),
  ('00000000-0000-0000-0000-00000000aa02', '00000000-0000-0000-0000-0000000000a1', 'Draft villa',    'draft-villa', 'villa', 9000000, 'draft', 'Hyderabad', 'Kadthal'),
  ('00000000-0000-0000-0000-00000000bb01', '00000000-0000-0000-0000-0000000000a2', 'Other plot',     'other-plot', 'plot', 2000000, 'draft', 'Hyderabad', 'Maheshwaram');
insert into property_location (property_id, city, locality, exact_lat, exact_lng, exact_address) values
  ('00000000-0000-0000-0000-00000000aa01', 'Hyderabad', 'Shadnagar', 17.07, 78.20, 'a');
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000d1', true);
update properties set status = 'published' where id = '00000000-0000-0000-0000-00000000aa01';
select set_config('request.jwt.claim.sub', '', true);

-- identical vectors for the published and the draft row; a query equal to them
insert into property_embeddings (property_id, embedding, content_hash, model)
select id, (select array_agg(case when i = 1 then 1.0 else 0.0 end)::real[] from generate_series(1, 768) i)::extensions.vector, 'h', 'test'
from properties where id in ('00000000-0000-0000-0000-00000000aa01', '00000000-0000-0000-0000-00000000aa02');

create temp table zz_q as
select (select array_agg(case when i = 1 then 1.0 else 0.0 end)::real[] from generate_series(1, 768) i)::extensions.vector as v;
grant select on zz_q to anon, authenticated;

insert into property_search_log (query, interpreted, result_count, used_ai) values
  ('plots in shadnagar under 20 lakh', '{"locality":"Shadnagar"}', 3, true),
  ('Shadnagar villa', null, 0, false),
  ('kadthal farm land', '{"locality":"Kadthal"}', 1, true),
  ('maheshwaram plots', '{"locality":"Maheshwaram"}', 2, true);

insert into ai_insight_cache (scope, subject_id, payload) values
  ('admin', 'admin', '{"summary":"admin only"}'),
  ('seller', '00000000-0000-0000-0000-0000000000a1', '{"summary":"seller A only"}');

-- ============================================================ embeddings table is server-only
select zz_t('anon cannot read property_embeddings',
  zz_try('anon', null, 'select * from property_embeddings') like 'blocked%');
select zz_t('seller cannot read property_embeddings',
  zz_try('authenticated', '00000000-0000-0000-0000-0000000000a1', 'select * from property_embeddings') like 'blocked%');
select zz_t('seller cannot write property_embeddings',
  zz_try('authenticated', '00000000-0000-0000-0000-0000000000a1',
    $q$delete from property_embeddings$q$) like 'blocked%');

-- ============================================================ semantic RPC only returns public listings
select zz_t('anon semantic search returns the published listing',
  zz_count('anon', null, $q$select count(*) from match_published_properties((select v from zz_q), 10, 0)
                            where property_id = '00000000-0000-0000-0000-00000000aa01'$q$) = 1);
select zz_t('anon semantic search never returns the draft listing',
  zz_count('anon', null, $q$select count(*) from match_published_properties((select v from zz_q), 10, 0)
                            where property_id = '00000000-0000-0000-0000-00000000aa02'$q$) = 0);
select zz_t('match count is capped at 200',
  zz_try('anon', null, $q$select * from match_published_properties((select v from zz_q), 100000, 0)$q$) = 'ok');

-- ============================================================ search log
select zz_t('anon cannot read the search log',
  zz_try('anon', null, 'select * from property_search_log') like 'blocked%');
select zz_t('anon cannot insert into the search log',
  zz_try('anon', null, $q$insert into property_search_log (query, result_count) values ('spam', 0)$q$) like 'blocked%');
select zz_t('seller sees no search log rows',
  zz_count('authenticated', '00000000-0000-0000-0000-0000000000a1', 'select count(*) from property_search_log') = 0);
select zz_t('admin can read the search log',
  zz_count('authenticated', '00000000-0000-0000-0000-0000000000d1', 'select count(*) from property_search_log') = 4);

-- ============================================================ insight cache
select zz_t('seller A sees only their own insight',
  zz_count('authenticated', '00000000-0000-0000-0000-0000000000a1', 'select count(*) from ai_insight_cache') = 1);
select zz_t('seller B sees no insights',
  zz_count('authenticated', '00000000-0000-0000-0000-0000000000a2', 'select count(*) from ai_insight_cache') = 0);
select zz_t('admin sees the admin insight',
  zz_count('authenticated', '00000000-0000-0000-0000-0000000000d1',
    $q$select count(*) from ai_insight_cache where scope = 'admin'$q$) = 1);
select zz_t('seller cannot write the insight cache',
  zz_try('authenticated', '00000000-0000-0000-0000-0000000000a1',
    $q$update ai_insight_cache set payload = '{}'$q$) like 'blocked%');

-- ============================================================ seller demand
select zz_t('seller A demand covers only their localities (2)',
  zz_count('authenticated', '00000000-0000-0000-0000-0000000000a1', 'select count(*) from seller_search_demand(30)') = 2);
select zz_t('seller A Shadnagar demand = 2 searches',
  zz_count('authenticated', '00000000-0000-0000-0000-0000000000a1',
    $q$select searches from seller_search_demand(30) where locality = 'shadnagar'$q$) = 2);
select zz_t('anon cannot call seller_search_demand',
  zz_try('anon', null, 'select * from seller_search_demand(30)') like 'blocked%');

rollback;
