-- 0029_lead_privacy_seller_view.sql
--
-- LEAD PRIVACY: buyer contact details are admin-only, enforced in the database.
--
-- Business rule: a buyer's enquiry goes to Property Planet/admin. The seller
-- may learn THAT a lead exists and see the buyer's NAME, the property, date,
-- status and the enquiry text -- but never the buyer's phone or email. The
-- Property Planet team coordinates the buyer and seller from there.
--
-- What was wrong before this migration
-- ------------------------------------
-- 0004 gave sellers "sellers can read leads on own properties" (SELECT on the
-- whole row) and "sellers can update status on own-property leads" (UPDATE on
-- any column). Since 0020/0021 the same row carries contact_phone and
-- contact_email, so any seller could read their buyers' phone/email with one
-- direct Supabase request (`supabase.from('leads').select('*')`), whatever the
-- UI showed -- and could even overwrite them. Column-level GRANTs cannot fix
-- this because admins and sellers share the `authenticated` database role.
--
-- What this migration does
-- ------------------------
--   1. Removes both seller policies on the base `leads` table. From now on a
--      seller has NO access to `leads` at all (nor to any embedded/joined read
--      of it: PostgREST embeds are filtered by the same RLS).
--   2. Adds `seller_leads`, a narrow view that is the ONLY way a seller reads
--      leads. It runs with the view owner's rights (security_invoker = false)
--      but hard-filters to p.owner_id = auth.uid(), and its column list simply
--      does not contain contact_phone / contact_email / buyer_id. What is not
--      selected cannot be leaked by any query parameter, id swap or
--      `select=*`.
--   3. Re-expresses the seller legs of the site_visits and
--      seller_contact_reveals policies through seller_owns_lead() -- a
--      security definer helper -- because those policies used to rely on the
--      seller being able to read the lead row (which they no longer can).
--      Behaviour of those two tables is unchanged.
--   4. Backfills leads.contact_email from auth.users for existing
--      property/project leads, so admin can see the buyer email on old leads
--      too. (New leads store it at submission time, see src/lib/leads/actions.ts.)
--      Nothing is deleted or rewritten other than filling NULL emails.
--
-- Untouched: buyers' own-lead policies, the admin policies, the general
-- contact-form insert policy, all triggers (incl. the seller "new enquiry"
-- notification, which only stores the property title).

-- ===========================================================================
-- 1. Backfill buyer email for admin (fills NULLs only)
-- ===========================================================================

update leads l
   set contact_email = u.email
  from auth.users u
 where u.id = l.buyer_id
   and l.contact_email is null
   and u.email is not null;

comment on column leads.contact_email is
  'Email given with this specific enquiry. Populated from the signed-in '
  'buyer''s account at submission time (property/project enquiries) or from '
  'the general contact form. ADMIN-ONLY: sellers have no access to `leads` '
  '(0029) and read enquiries through the seller_leads view, which omits '
  'contact_email/contact_phone.';

comment on column leads.contact_phone is
  'Callback number submitted with this enquiry. ADMIN-ONLY (see 0029): '
  'sellers read enquiries through the seller_leads view, which omits it.';

-- ===========================================================================
-- 2. Sellers lose direct access to the base table
-- ===========================================================================

drop policy if exists "sellers can read leads on own properties" on leads;
drop policy if exists "sellers can update status on own-property leads" on leads;

-- ===========================================================================
-- 3. Ownership helper (security definer: reads leads/properties without
--    depending on the caller's RLS; returns only a boolean)
-- ===========================================================================

create or replace function seller_owns_lead(p_lead_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from leads l
    join properties p on p.id = l.property_id
    where l.id = p_lead_id
      and p.owner_id = auth.uid()
  );
$$;

comment on function seller_owns_lead is
  'True when the caller owns the property the given lead is about. Boolean '
  'only -- discloses nothing about the lead. Used by site_visits and '
  'seller_contact_reveals policies now that sellers cannot read `leads`.';

revoke all on function seller_owns_lead(uuid) from public, anon;
grant execute on function seller_owns_lead(uuid) to authenticated;

-- site_visits: same visibility as 0004 (buyer of the lead, owning seller,
-- admin); the seller leg now goes through the helper.
drop policy if exists "site visits follow lead visibility" on site_visits;
create policy "site visits follow lead visibility"
  on site_visits for select
  using (
    current_role_is('admin')
    or seller_owns_lead(site_visits.lead_id)
    or exists (
      select 1 from leads l
      where l.id = site_visits.lead_id
        and l.buyer_id = auth.uid()
    )
  );

drop policy if exists "sellers can update site visits on own-property leads" on site_visits;
create policy "sellers can update site visits on own-property leads"
  on site_visits for update
  using (seller_owns_lead(site_visits.lead_id));

drop policy if exists "reveal log readable by involved parties" on seller_contact_reveals;
create policy "reveal log readable by involved parties"
  on seller_contact_reveals for select
  using (
    revealed_to = auth.uid()
    or current_role_is('admin')
    or seller_owns_lead(seller_contact_reveals.lead_id)
  );

-- ===========================================================================
-- 4. seller_leads: the seller's ONLY window onto leads
-- ===========================================================================
--
-- Deliberately absent: buyer_id, contact_phone, contact_email, source,
-- project_id. buyer_name resolves to the name given with the enquiry, then
-- the buyer's profile name, then a neutral label -- profile.phone is never
-- selected.

drop view if exists seller_leads;
create view seller_leads
  with (security_invoker = false, security_barrier = true) as
  select
    l.id,
    l.property_id,
    p.title                                            as property_title,
    p.slug                                             as property_slug,
    coalesce(nullif(btrim(l.contact_name), ''), nullif(btrim(pr.full_name), ''), 'Buyer')
                                                       as buyer_name,
    l.message,
    l.status,
    l.preferred_date,
    l.preferred_time,
    l.created_at
  from leads l
  join properties p on p.id = l.property_id
  left join profiles pr on pr.id = l.buyer_id
  where p.owner_id = auth.uid();

comment on view seller_leads is
  'Seller-facing projection of leads on the caller''s own properties. Runs '
  'with owner rights but is hard-filtered to properties.owner_id = auth.uid(). '
  'Contains NO buyer phone/email/id by construction -- the admin controls '
  'buyer/seller communication. Sellers have no direct access to `leads`.';

revoke all on seller_leads from public, anon;
grant select on seller_leads to authenticated;
