-- supabase/tests/lead_privacy_rls.sql
--
-- Verifies the lead privacy boundary (migration 0029) at the database level.
-- Run against a scratch database that has migrations 0001..0029 applied:
--
--   psql "$DATABASE_URL" -f supabase/tests/lead_privacy_rls.sql
--
-- Everything happens inside one transaction that is ROLLED BACK at the end,
-- so it leaves no data behind. Each check prints "PASS <name>" or "FAIL <name>".
-- Requires a role that can SET ROLE authenticated/anon (e.g. postgres).
-- Do NOT run against production.

\set ON_ERROR_STOP off
begin;

create function zz_t(p_name text, p_ok boolean) returns void language plpgsql as $$
begin
  if p_ok then raise notice 'PASS  %', p_name; else raise notice 'FAIL  %', p_name; end if;
end $$;
grant execute on function zz_t(text, boolean) to public;

-- ---------------------------------------------------------------- seed (superuser)
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000a1', 'sellerA@example.com'),
  ('00000000-0000-0000-0000-0000000000b1', 'sellerB@example.com'),
  ('00000000-0000-0000-0000-0000000000c1', 'rahul@example.com'),
  ('00000000-0000-0000-0000-0000000000c2', 'ayesha@example.com'),
  ('00000000-0000-0000-0000-0000000000d1', 'admin@example.com');
update profiles set role = 'seller', full_name = 'Seller A', phone = '+911111111111' where id = '00000000-0000-0000-0000-0000000000a1';
update profiles set role = 'seller', full_name = 'Seller B', phone = '+912222222222' where id = '00000000-0000-0000-0000-0000000000b1';
update profiles set role = 'buyer',  full_name = 'Rahul',    phone = '+919999999991' where id = '00000000-0000-0000-0000-0000000000c1';
update profiles set role = 'buyer',  full_name = 'Ayesha',   phone = '+919999999992' where id = '00000000-0000-0000-0000-0000000000c2';
update profiles set role = 'admin',  full_name = 'Admin'     where id = '00000000-0000-0000-0000-0000000000d1';

insert into properties (id, owner_id, title, slug, property_type, price, status, city, locality) values
  ('00000000-0000-0000-0000-00000000aa01', '00000000-0000-0000-0000-0000000000a1', 'Plot A', 'plot-a', 'plot', 1000000, 'draft', 'Hyderabad', 'Shadnagar'),
  ('00000000-0000-0000-0000-00000000bb01', '00000000-0000-0000-0000-0000000000b1', 'Plot B', 'plot-b', 'plot', 2000000, 'draft', 'Hyderabad', 'Kadthal');

-- ---------------------------------------------------------------- buyers submit
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000c1', true);
insert into leads (buyer_id, property_id, message, contact_name, contact_phone, contact_email) values
  ('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-00000000aa01', 'Interested in Plot A', 'Rahul', '+919999999991', 'rahul@example.com'),
  ('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-00000000bb01', 'Interested in Plot B', 'Rahul', '+919999999991', 'rahul@example.com');
select zz_t('buyer: submitting own leads works', (select count(*) = 2 from leads));
insert into site_visits (lead_id) select id from leads where property_id = '00000000-0000-0000-0000-00000000aa01';

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000c2', true);
select zz_t('buyer: another buyer sees none of these leads', (select count(*) = 0 from leads));
insert into leads (buyer_id, property_id, message, contact_name, contact_phone, contact_email) values
  ('00000000-0000-0000-0000-0000000000c2', '00000000-0000-0000-0000-00000000aa01', 'Ayesha here', 'Ayesha', '+919999999992', 'ayesha@example.com');
reset role;

-- ---------------------------------------------------------------- admin
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000d1', true);
select zz_t('admin: sees all 3 leads', (select count(*) = 3 from leads));
select zz_t('admin: sees buyer phone + email + name', (select count(*) = 3 from leads where contact_phone is not null and contact_email is not null and contact_name is not null));
reset role;

-- ---------------------------------------------------------------- seller A
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a1', true);

select zz_t('seller A: direct SELECT on leads returns nothing', (select count(*) = 0 from leads));
select zz_t('seller A: direct SELECT of phone/email returns nothing', (select count(*) = 0 from leads where contact_phone is not null or contact_email is not null));
select zz_t('seller A: cannot select leads by known id', (select count(*) = 0 from leads where property_id = '00000000-0000-0000-0000-00000000aa01'));
with u as (update leads set contact_phone = '000000', status = 'closed' returning 1)
  select zz_t('seller A: cannot UPDATE leads', (select count(*) = 0 from u));
select zz_t('seller A: embedded read of leads via notifications returns nothing',
  (select count(*) = 0 from leads where id in (select lead_id from notifications)));

select zz_t('seller A: seller_leads shows 2 leads on own property', (select count(*) = 2 from seller_leads));
select zz_t('seller A: sees buyer names', (select array_agg(buyer_name order by buyer_name) = array['Ayesha','Rahul'] from seller_leads));
select zz_t('seller A: sees property + message + status',
  (select bool_and(property_title = 'Plot A' and message is not null and status = 'new') from seller_leads));
select zz_t('seller A: view has NO phone/email/buyer_id columns',
  (select count(*) = 0 from information_schema.columns
    where table_name = 'seller_leads' and table_schema = 'public'
      and column_name in ('contact_phone','contact_email','phone','email','buyer_id','source')));
select zz_t('seller A: cannot see seller B''s lead through the view (filter by B property id)',
  (select count(*) = 0 from seller_leads where property_id = '00000000-0000-0000-0000-00000000bb01'));
select zz_t('seller A: notification about the new lead exists', (select count(*) = 2 from notifications where type = 'new_lead'));
select zz_t('seller A: site visit on own lead still readable (parity)', (select count(*) = 1 from site_visits));
reset role;

-- ---------------------------------------------------------------- seller B
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000b1', true);
select zz_t('seller B: sees only own lead (1)', (select count(*) = 1 from seller_leads where property_title = 'Plot B'));
select zz_t('seller B: does not see seller A''s leads', (select count(*) = 0 from seller_leads where property_id = '00000000-0000-0000-0000-00000000aa01'));
select zz_t('seller B: direct leads read returns nothing', (select count(*) = 0 from leads));
select zz_t('seller B: cannot read seller A''s site visits', (select count(*) = 0 from site_visits));
reset role;

-- ---------------------------------------------------------------- buyer keeps own access
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000c1', true);
select zz_t('buyer Rahul: still reads own 2 leads', (select count(*) = 2 from leads));
select zz_t('buyer Rahul: sees nothing in seller_leads (owns no property)', (select count(*) = 0 from seller_leads));
reset role;

-- ---------------------------------------------------------------- anonymous
set local role anon;
select set_config('request.jwt.claim.sub', '', true);
do $$ begin
  perform 1 from seller_leads;
  perform zz_t('anon: seller_leads is not readable', false);
exception when insufficient_privilege then
  perform zz_t('anon: seller_leads is not readable', true);
end $$;
select zz_t('anon: leads returns nothing', (select count(*) = 0 from leads));
reset role;

rollback;
