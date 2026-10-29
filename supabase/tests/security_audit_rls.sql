-- supabase/tests/security_audit_rls.sql
--
-- Regression tests for the 2026-10 security audit (fixed in
-- 0037_security_audit_fixes.sql). Each block attempts an attack as an
-- ordinary signed-in buyer or seller, exactly as it could be sent through
-- Supabase's public REST API with the anon key + the user's own JWT.
--
-- Run against a scratch database with all migrations applied:
--
--   psql "$DATABASE_URL" -f supabase/tests/security_audit_rls.sql
--
-- One transaction, ROLLED BACK at the end. Prints "PASS <name>" when the
-- attack is blocked (or the legitimate action still works), "FAIL <name>"
-- otherwise. Requires a role that can SET ROLE authenticated (e.g.
-- postgres). Do NOT run against production.

\set ON_ERROR_STOP off
\set QUIET on
begin;

create function zz_t(p_name text, p_ok boolean) returns void language plpgsql as $$
begin
  if p_ok then raise notice 'PASS  %', p_name; else raise notice 'FAIL  %', p_name; end if;
end $$;
grant execute on function zz_t(text, boolean) to public;

-- Runs p_sql as the given user under the `authenticated` role and reports
-- whether it raised. security invoker, so SET ROLE inside applies.
create function zz_try(p_uid uuid, p_sql text) returns text language plpgsql as $$
begin
  perform set_config('request.jwt.claim.sub', p_uid::text, true);
  execute 'set local role authenticated';
  begin
    execute p_sql;
  exception when others then
    execute 'reset role';
    return 'blocked: ' || sqlerrm;
  end;
  execute 'reset role';
  return 'ok';
end $$;

-- ------------------------------------------------------------------ seed
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000a1', 'seller@example.com'),
  ('00000000-0000-0000-0000-0000000000c1', 'buyer@example.com'),
  ('00000000-0000-0000-0000-0000000000d1', 'admin@example.com');
update profiles set role = 'seller', phone = '+911111111111' where id = '00000000-0000-0000-0000-0000000000a1';
update profiles set role = 'buyer',  phone = '+919999999991' where id = '00000000-0000-0000-0000-0000000000c1';
update profiles set role = 'admin' where id = '00000000-0000-0000-0000-0000000000d1';

insert into projects (id, title, slug, status) values
  ('00000000-0000-0000-0000-0000000000f1', 'Curated Project', 'curated-project', 'published');

insert into properties (id, owner_id, title, slug, property_type, price, status, city, locality) values
  ('00000000-0000-0000-0000-00000000aa01', '00000000-0000-0000-0000-0000000000a1', 'Plot One', 'plot-one', 'plot', 1000000, 'draft', 'Hyderabad', 'Shadnagar'),
  ('00000000-0000-0000-0000-00000000aa02', '00000000-0000-0000-0000-0000000000a1', 'Plot Two', 'plot-two', 'plot', 2000000, 'draft', 'Hyderabad', 'Kadthal');
insert into property_location (property_id, city, locality, exact_lat, exact_lng, exact_address) values
  ('00000000-0000-0000-0000-00000000aa01', 'Hyderabad', 'Shadnagar', 17.07, 78.20, 'SECRET ADDRESS ONE'),
  ('00000000-0000-0000-0000-00000000aa02', 'Hyderabad', 'Kadthal',   16.98, 78.50, 'SECRET ADDRESS TWO');
-- publish both, as the admin would
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000d1', true);
update properties set status = 'published';
select set_config('request.jwt.claim.sub', '', true);

-- ============================================================ A. location reveal bypass via self-confirmed site visit
select zz_t('A0 buyer can file a normal lead',
  zz_try('00000000-0000-0000-0000-0000000000c1',
    $q$insert into leads (id, buyer_id, property_id) values
       ('00000000-0000-0000-0000-0000000001a1', '00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-00000000aa01')$q$) = 'ok');

select zz_t('A1 buyer CANNOT insert a site visit already marked confirmed',
  zz_try('00000000-0000-0000-0000-0000000000c1',
    $q$insert into site_visits (lead_id, status) values ('00000000-0000-0000-0000-0000000001a1', 'confirmed')$q$) like 'blocked%');

select zz_t('A2 buyer CANNOT reveal the exact address without a seller-confirmed visit',
  zz_try('00000000-0000-0000-0000-0000000000c1',
    $q$select * from reveal_exact_location('00000000-0000-0000-0000-0000000001a1')$q$) like 'blocked%');

select zz_t('A3 buyer can still request a site visit normally',
  zz_try('00000000-0000-0000-0000-0000000000c1',
    $q$insert into site_visits (lead_id) values ('00000000-0000-0000-0000-0000000001a1')$q$) = 'ok');

-- ============================================================ B. location reveal bypass via self-escalated lead status
select zz_t('B1 buyer CANNOT insert a lead already in negotiation',
  zz_try('00000000-0000-0000-0000-0000000000c1',
    $q$insert into leads (id, buyer_id, property_id, status) values
       ('00000000-0000-0000-0000-0000000001b1', '00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-00000000aa02', 'negotiation')$q$) like 'blocked%');

select zz_t('B2 buyer CANNOT reveal plot two''s exact address',
  zz_try('00000000-0000-0000-0000-0000000000c1',
    $q$select * from reveal_exact_location('00000000-0000-0000-0000-0000000001b1')$q$) like 'blocked%');

-- ============================================================ C. seller self-attaching to an admin-curated project (0030 regression)
select zz_t('C1 seller CANNOT attach own listing to a curated project',
  zz_try('00000000-0000-0000-0000-0000000000a1',
    $q$update properties set project_id = '00000000-0000-0000-0000-0000000000f1'
       where id = '00000000-0000-0000-0000-00000000aa01'$q$) like 'blocked%');

select zz_t('C2 seller can still edit ordinary fields of own listing',
  zz_try('00000000-0000-0000-0000-0000000000a1',
    $q$update properties set description = 'Corner plot, east facing'
       where id = '00000000-0000-0000-0000-00000000aa01'$q$) = 'ok');

-- ============================================================ D. oversized free text from the public
select zz_t('D1 anonymous-style contact lead with a 100KB message is rejected',
  zz_try('00000000-0000-0000-0000-0000000000c1',
    $q$insert into leads (source, contact_name, contact_phone, contact_email, message)
       values ('contact_form', 'Spam', '9876543210', 'x@example.com', repeat('x', 100000))$q$) like 'blocked%');

-- ============================================================ E. notifications tampering
insert into notifications (id, recipient_id, type, message) values
  ('00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-0000000000a1', 'info', 'original');
select zz_t('E1 recipient CANNOT rewrite a notification''s message',
  zz_try('00000000-0000-0000-0000-0000000000a1',
    $q$update notifications set message = 'forged' where id = '00000000-0000-0000-0000-0000000000e1'$q$) like 'blocked%');
select zz_t('E2 recipient can still mark a notification read',
  zz_try('00000000-0000-0000-0000-0000000000a1',
    $q$update notifications set read = true where id = '00000000-0000-0000-0000-0000000000e1'$q$) = 'ok');

rollback;
