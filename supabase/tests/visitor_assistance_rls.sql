-- supabase/tests/visitor_assistance_rls.sql
--
-- Verifies the visitor-assistance feature (migration 0031) at the
-- database level. Run against a scratch database that has migrations
-- 0001..0031 applied:
--
--   psql "$DATABASE_URL" -f supabase/tests/visitor_assistance_rls.sql
--
-- Everything happens inside one transaction that is ROLLED BACK at the
-- end, so it leaves no data behind. Each check prints "PASS <name>" or
-- "FAIL <name>". Requires a role that can SET ROLE authenticated/anon
-- (e.g. postgres). Do NOT run against production.

\set ON_ERROR_STOP off
begin;

create function zz_t(p_name text, p_ok boolean) returns void language plpgsql as $$
begin
  if p_ok then raise notice 'PASS  %', p_name; else raise notice 'FAIL  %', p_name; end if;
end $$;
grant execute on function zz_t(text, boolean) to public;

-- ---------------------------------------------------------------- seed (superuser)
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000e1', 'sellerC@example.com'),
  ('00000000-0000-0000-0000-0000000000e2', 'visitorA@example.com');
update profiles set role = 'seller', full_name = 'Seller C', phone = '+913333333333' where id = '00000000-0000-0000-0000-0000000000e1';
update profiles set role = 'buyer',  full_name = 'Visitor A', phone = '+914444444444' where id = '00000000-0000-0000-0000-0000000000e2';

insert into properties (id, owner_id, title, slug, property_type, listing_type, status, city, locality)
values ('00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000e1',
        'Test Villa', 'test-villa-va', 'villa', 'sale', 'published', 'Hyderabad', 'Gachibowli');

insert into properties (id, owner_id, title, slug, property_type, listing_type, status, city, locality)
values ('00000000-0000-0000-0000-0000000000f2', '00000000-0000-0000-0000-0000000000e1',
        'Draft Plot', 'draft-plot-va', 'plot', 'sale', 'draft', 'Hyderabad', 'Kondapur');

-- =============================================================== 1. anonymous submit
set role anon;
select set_config('request.jwt.claim.sub', '', true);

do $$
declare v_id uuid;
begin
  select submit_visitor_assistance_request(
    'Anon Visitor', '+919000000001', 'villa'::visitor_requirement_type,
    null, 'Gachibowli', '50L-70L', 'Looking urgently', 'test-villa-va'
  ) into v_id;
  perform zz_t('anonymous visitor can submit', v_id is not null);
end $$;

reset role;
select zz_t('anonymous request has NULL requester_id and buyer_id',
  (select requester_id is null and buyer_id is null from leads
   where source = 'visitor_assistance' and contact_phone = '+919000000001'));
select zz_t('anonymous request resolved the property from the slug',
  (select property_id = '00000000-0000-0000-0000-0000000000f1' from leads
   where source = 'visitor_assistance' and contact_phone = '+919000000001'));

-- =============================================================== 2. invalid input rejected
set role anon;
do $$
declare v_failed boolean := false;
begin
  begin
    perform submit_visitor_assistance_request('', '+919000000002', 'villa'::visitor_requirement_type);
  exception when others then
    v_failed := true;
  end;
  perform zz_t('empty name rejected', v_failed);
end $$;

do $$
declare v_failed boolean := false;
begin
  begin
    perform submit_visitor_assistance_request('Someone', '', 'villa'::visitor_requirement_type);
  exception when others then
    v_failed := true;
  end;
  perform zz_t('empty phone rejected', v_failed);
end $$;
reset role;

-- =============================================================== 3. draft property rejected
set role anon;
do $$
declare v_failed boolean := false;
begin
  begin
    perform submit_visitor_assistance_request(
      'Someone', '+919000000003', 'plot_land'::visitor_requirement_type,
      null, null, null, null, 'draft-plot-va'
    );
  exception when others then
    v_failed := true;
  end;
  perform zz_t('draft property slug rejected', v_failed);
end $$;

-- =============================================================== 4. unknown property rejected
do $$
declare v_failed boolean := false;
begin
  begin
    perform submit_visitor_assistance_request(
      'Someone', '+919000000004', 'plot_land'::visitor_requirement_type,
      null, null, null, null, 'does-not-exist'
    );
  exception when others then
    v_failed := true;
  end;
  perform zz_t('unknown property slug rejected', v_failed);
end $$;
reset role;

-- =============================================================== 5. direct insert blocked (no RLS policy for this shape)
set role anon;
do $$
declare v_failed boolean := false;
begin
  begin
    insert into leads (source, contact_name, contact_phone, requirement_type)
    values ('visitor_assistance', 'Direct Insert', '+919000000005', 'villa');
  exception when others then
    v_failed := true;
  end;
  perform zz_t('direct insert of a visitor_assistance lead is blocked', v_failed);
end $$;
reset role;

-- =============================================================== 6. forged buyer_id blocked by the shape constraint
set role postgres;
do $$
declare v_failed boolean := false;
begin
  begin
    insert into leads (source, buyer_id, contact_name, contact_phone, requirement_type)
    values ('visitor_assistance', '00000000-0000-0000-0000-0000000000e2', 'Forged', '+919000000006', 'villa');
  exception when others then
    v_failed := true;
  end;
  perform zz_t('visitor_assistance row with buyer_id set is rejected by the shape check', v_failed);
end $$;

-- =============================================================== 7. rate limiting
set role anon;
do $$
declare v_id uuid; v_failed boolean := false;
begin
  perform submit_visitor_assistance_request('Rate A', '+919000000010', 'villa'::visitor_requirement_type);
  perform submit_visitor_assistance_request('Rate A', '+919000000010', 'villa'::visitor_requirement_type);
  perform submit_visitor_assistance_request('Rate A', '+919000000010', 'villa'::visitor_requirement_type);
  begin
    perform submit_visitor_assistance_request('Rate A', '+919000000010', 'villa'::visitor_requirement_type);
  exception when others then
    v_failed := true;
  end;
  perform zz_t('4th request from same phone within an hour is rate-limited', v_failed);
end $$;
reset role;

-- =============================================================== 8. seller visibility protection
set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000e1', true);
select zz_t('seller cannot see visitor_assistance leads via seller_leads',
  not exists (select 1 from seller_leads where property_id = '00000000-0000-0000-0000-0000000000f1'
              and buyer_name in ('Anon Visitor', 'Visitor A')));
reset role;

-- =============================================================== 9. seller notification protection
select zz_t('no seller notification was created for the visitor_assistance lead',
  not exists (
    select 1 from notifications n
    join leads l on l.id = n.lead_id
    where l.source = 'visitor_assistance' and n.recipient_id = '00000000-0000-0000-0000-0000000000e1'
  ));

-- =============================================================== 10. admin visibility
set role authenticated;
-- (admin role check relies on profiles.role = 'admin'; using postgres/service role read here
--  since this test doesn't seed a real admin session — see lead_privacy_rls.sql for that pattern)
reset role;
select zz_t('admin (service-level) can read the visitor_assistance lead directly',
  exists (select 1 from leads where source = 'visitor_assistance' and contact_phone = '+919000000001'));

-- =============================================================== 11. signed-in requester_id
set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000e2', true);
do $$
declare v_id uuid;
begin
  select submit_visitor_assistance_request('Visitor A', '+919000000020', 'apartment'::visitor_requirement_type)
    into v_id;
  perform zz_t('signed-in visitor request created', v_id is not null);
end $$;
reset role;
select zz_t('signed-in visitor request carries requester_id, not buyer_id',
  (select requester_id = '00000000-0000-0000-0000-0000000000e2' and buyer_id is null
   from leads where source = 'visitor_assistance' and contact_phone = '+919000000020'));

-- =============================================================== 12. account deletion scrubbing
set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000e2', true);
select request_own_account_deletion();
reset role;
select zz_t('account deletion scrubs personal fields on requester_id-keyed leads',
  (select contact_name is null and contact_phone is null from leads
   where requester_id = '00000000-0000-0000-0000-0000000000e2'
     and source = 'visitor_assistance' and contact_email is null and contact_phone is null));

rollback;
