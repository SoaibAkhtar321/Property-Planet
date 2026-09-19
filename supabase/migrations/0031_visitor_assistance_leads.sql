-- 0031_visitor_assistance_leads.sql
--
-- Phase 4: Visitor Assistance / Property Lead Capture.
--
-- An actively browsing visitor may voluntarily ask Property Planet for
-- help (find them a plot/villa/apartment/etc., or answer a question about
-- a specific listing they're on). This is NOT a way to identify anonymous
-- visitors or silently obtain a phone number — the visitor explicitly
-- fills in and submits a form. Everything below reuses the existing
-- `leads` table and lead-status system (0004, 0020, 0021, 0029) rather
-- than introducing a second, competing table.
--
-- Shape of a visitor-assistance lead:
--   source          = 'visitor_assistance'
--   requirement_type = one of the existing site categories (below)
--   requester_id    = the signed-in visitor, if any (NULL for anonymous) —
--                      kept separate from buyer_id: this is not a buyer
--                      enquiry against a specific listing, so overloading
--                      buyer_id would incorrectly make it look like one
--                      everywhere buyer_id is already relied on (RLS,
--                      "my leads", etc).
--   buyer_id        = always NULL for this lead shape (see below)
--   property_id     = the property being viewed, if any, re-derived
--                      server-side from a slug — never trusted from the
--                      client (see submit_visitor_assistance_request()).
--
-- Privacy decision (unchanged from the brief, restated here since it's
-- enforced in this migration): Visitor -> Property Planet Admin -> Admin
-- contacts visitor. Sellers never see these leads, never get notified of
-- them, and buyer_id stays NULL so no buyer-side "my leads" surface picks
-- them up either.

-- ===========================================================================
-- 1. Columns
-- ===========================================================================

do $$
begin
  if not exists (
    select 1 from pg_type t
    join pg_enum e on e.enumtypid = t.oid
    where t.typname = 'lead_status' -- sanity: lead_status already exists (0004)
  ) then
    raise exception 'lead_status enum not found — migrations out of order';
  end if;
end $$;

create type visitor_requirement_type as enum
  ('plot_land', 'villa', 'apartment', 'commercial', 'other');

alter table leads
  add column if not exists requirement_type visitor_requirement_type,
  add column if not exists requester_id uuid references profiles (id) on delete set null;

comment on column leads.requirement_type is
  'What a visitor-assistance requester says they are looking for (source = '
  '''visitor_assistance'' only). Matches the site''s existing property '
  'categories: Plot/Land, Villa, Apartment, Commercial, Other. NULL for '
  'every other lead shape.';

comment on column leads.requester_id is
  'The signed-in visitor who submitted a visitor-assistance request, if '
  'any (NULL for an anonymous visitor). Deliberately separate from '
  'buyer_id, which stays NULL for this lead shape — a visitor-assistance '
  'request is not a buyer enquiry against a specific listing, and every '
  'existing buyer_id-keyed surface (buyer "my leads", the leads_buyer_* '
  'unique constraints) must not pick these rows up. ON DELETE SET NULL so '
  'account deletion (0030) detaches the identity without deleting the '
  'business record — its personal fields are additionally scrubbed by '
  'request_own_account_deletion() below.';

create index if not exists leads_requester_idx on leads (requester_id);

-- The existing 0013 "project or property required" check already carves
-- out source = 'contact_form'; extend it to also allow visitor_assistance
-- rows to have neither (general assistance ask, not tied to any one
-- listing) alongside the existing shapes.
alter table leads
  drop constraint if exists leads_project_or_property_required;
alter table leads
  add constraint leads_project_or_property_required
  check (
    project_id is not null
    or property_id is not null
    or source = 'contact_form'
    or source = 'visitor_assistance'
  );

-- A visitor-assistance row must always carry its own submitted identity
-- (name + phone are required by the form; see assistanceInput.ts) and a
-- requirement_type, and must never carry a buyer_id — that column is
-- reserved for an actual buyer-authenticated enquiry against a listing.
alter table leads
  drop constraint if exists leads_visitor_assistance_shape;
alter table leads
  add constraint leads_visitor_assistance_shape
  check (
    source <> 'visitor_assistance'
    or (
      buyer_id is null
      and contact_name is not null
      and contact_phone is not null
      and requirement_type is not null
    )
  );

-- ===========================================================================
-- 2. Secure insertion function
--
-- There is deliberately NO direct client-callable RLS insert policy for
-- source = 'visitor_assistance' (unlike the contact_form shape, 0021,
-- which is a plain policy because it needs no server-side property
-- resolution). Every visitor-assistance row is written through this
-- SECURITY DEFINER function instead, because it has to do work a plain
-- RLS `with check` cannot:
--   - resolve a client-supplied property SLUG against property_public
--     (never trust a client-supplied property id/title directly)
--   - take the requester identity from auth.uid(), never from the client
--   - apply the same contact_form-style rate limit
-- ===========================================================================

create or replace function submit_visitor_assistance_request(
  p_name             text,
  p_phone            text,
  p_requirement_type visitor_requirement_type,
  p_email            text default null,
  p_location         text default null,
  p_budget           text default null,
  p_details          text default null,
  p_property_slug    text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_requester_id uuid := auth.uid(); -- NULL for an anonymous visitor; never client-supplied
  v_property_id  uuid;
  v_name         text := btrim(coalesce(p_name, ''));
  v_phone        text := btrim(coalesce(p_phone, ''));
  v_message      text;
  v_recent_count integer;
  v_lead_id      uuid;
begin
  if v_name = '' or char_length(v_name) > 120 then
    raise exception 'A valid name is required.' using errcode = 'P0001';
  end if;

  if v_phone = '' then
    raise exception 'A valid phone number is required.' using errcode = 'P0001';
  end if;

  -- Property context: the browser sends a SLUG, never an id/title. Resolve
  -- it against property_public only — draft/pending/archived/rejected
  -- properties can never be attached to a request this way, and a slug
  -- that doesn't resolve to a published property fails the whole request
  -- rather than silently dropping the property context (see Decision B in
  -- the phase brief: stale property context fails, it doesn't degrade to
  -- a property-less lead).
  if p_property_slug is not null and btrim(p_property_slug) <> '' then
    select id into v_property_id
    from property_public
    where slug = btrim(p_property_slug);

    if v_property_id is null then
      raise exception 'This property is no longer available.' using errcode = 'P0001';
    end if;
  end if;

  -- Rate limit, same shape and threshold as enforce_general_inquiry_rate_limit
  -- (0025): 3 requests per phone/email/account in the last hour. Applied
  -- here rather than as a trigger since this function is the only writer
  -- for this lead shape.
  select count(*) into v_recent_count
  from leads
  where source = 'visitor_assistance'
    and created_at > now() - interval '60 minutes'
    and (
      contact_phone = v_phone
      or (p_email is not null and contact_email = btrim(p_email))
      or (v_requester_id is not null and requester_id = v_requester_id)
    );

  if v_recent_count >= 3 then
    raise exception 'Too many requests submitted recently. Please try again later.'
      using errcode = 'P0001';
  end if;

  v_message := nullif(btrim(concat_ws(
    E'\n',
    case when p_location is not null and btrim(p_location) <> '' then 'Location: ' || btrim(p_location) end,
    case when p_budget is not null and btrim(p_budget) <> '' then 'Budget: ' || btrim(p_budget) end,
    case when p_details is not null and btrim(p_details) <> '' then btrim(p_details) end
  )), '');

  insert into leads (
    buyer_id, property_id, project_id, source, requester_id,
    requirement_type, contact_name, contact_phone, contact_email, message
  ) values (
    null, v_property_id, null, 'visitor_assistance', v_requester_id,
    p_requirement_type, v_name, v_phone, nullif(btrim(coalesce(p_email, '')), ''), v_message
  )
  returning id into v_lead_id;

  return v_lead_id;
end;
$$;

comment on function submit_visitor_assistance_request is
  'The only write path for a visitor-assistance lead. SECURITY DEFINER so '
  'it can insert into `leads` with no direct client-callable RLS policy '
  'for this shape, but every value that matters for authorization or '
  'identity is re-derived here, never trusted from the client: requester '
  'identity from auth.uid(), property context resolved from a slug '
  'against property_public (draft/unpublished properties are rejected), '
  'and a phone/email/account rate limit mirroring '
  'enforce_general_inquiry_rate_limit (0025).';

revoke all on function submit_visitor_assistance_request(
  text, text, visitor_requirement_type, text, text, text, text, text
) from public, anon;
grant execute on function submit_visitor_assistance_request(
  text, text, visitor_requirement_type, text, text, text, text, text
) to authenticated, anon;

-- ===========================================================================
-- 3. Seller privacy: exclude visitor-assistance leads from seller_leads
--
-- seller_leads (0029) is filtered to properties.owner_id = auth.uid() but
-- was not filtered by source — a visitor-assistance request tied to a
-- seller's property would otherwise leak through it (buyer_name/message,
-- even without phone/email). Re-declared with the same column list, plus
-- one added predicate.
-- ===========================================================================

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
  where p.owner_id = auth.uid()
    and l.source is distinct from 'visitor_assistance';

comment on view seller_leads is
  'Seller-facing projection of leads on the caller''s own properties. Runs '
  'with owner rights but is hard-filtered to properties.owner_id = auth.uid(). '
  'Contains NO buyer phone/email/id by construction, and (0031) excludes '
  'visitor-assistance requests entirely -- those are handled Visitor -> '
  'Property Planet Admin -> Admin contacts visitor, never surfaced to the '
  'seller at all. Sellers have no direct access to `leads`.';

revoke all on seller_leads from public, anon;
grant select on seller_leads to authenticated;

-- ===========================================================================
-- 4. Seller notification: skip visitor-assistance leads
-- ===========================================================================

create or replace function notify_seller_on_new_lead()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_seller_id uuid;
  v_property_title text;
begin
  -- Project-only lead (property_id null) has no property owner to notify.
  if new.property_id is null then
    return new;
  end if;

  -- 0031: visitor-assistance requests are admin-only by design (see
  -- seller_leads above) — the seller must not be notified that one exists
  -- either, even when it references one of their properties.
  if new.source = 'visitor_assistance' then
    return new;
  end if;

  select p.owner_id, p.title
    into v_seller_id, v_property_title
  from properties p
  where p.id = new.property_id;

  if v_seller_id is not null then
    insert into notifications (recipient_id, type, message, lead_id)
    values (
      v_seller_id,
      'new_lead',
      coalesce('You have a new enquiry on "' || v_property_title || '".',
               'You have a new enquiry on one of your listings.'),
      new.id
    );
  end if;

  return new;
end;
$$;

comment on function notify_seller_on_new_lead is
  'AFTER INSERT trigger on `leads`. Notifies the property owner of a new '
  'property-level enquiry (project-only leads, property_id NULL, have no '
  'single property owner and are skipped; visitor-assistance leads, 0031, '
  'are skipped by design -- admin-only, never surfaced to the seller). '
  'Recipient is re-derived from properties.owner_id, never trusted from '
  'the inserted row directly.';

-- ===========================================================================
-- 5. Account deletion: also scrub requester_id leads
--
-- request_own_account_deletion() (0030) already scrubs every personal
-- field on leads where buyer_id = the deleting account. A visitor-
-- assistance request from that same account is keyed by requester_id
-- instead (buyer_id is always NULL on that shape), so it needs the same
-- treatment or its name/phone/email would survive the account's deletion.
-- Re-declared in full; every other part of 0030's function is unchanged.
-- ===========================================================================

create or replace function request_own_account_deletion()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid  uuid := auth.uid();
  v_role user_role;
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;

  select role into v_role from profiles where id = v_uid;

  if v_role is null then
    raise exception 'no profile found for this account';
  end if;

  if v_role = 'admin' then
    raise exception 'admin accounts cannot be deleted through this function';
  end if;

  perform set_config('app.deleting_own_account', 'true', true);

  delete from favourites where user_id = v_uid;

  update leads
     set contact_name  = null,
         contact_email = null,
         contact_phone = null,
         message       = null
   where buyer_id = v_uid;

  -- 0031: visitor-assistance leads from this account are keyed by
  -- requester_id, not buyer_id (which is always NULL on that shape) --
  -- scrub those too. requirement_type is left in place: it is a category,
  -- not personal data, and is useful admin business context the same way
  -- an enquiry's existence is kept elsewhere in this function.
  update leads
     set contact_name  = null,
         contact_email = null,
         contact_phone = null,
         message       = null
   where requester_id = v_uid;

  update properties
     set status = 'archived'
   where owner_id = v_uid
     and status in ('draft', 'pending', 'published');
end;
$$;

comment on function request_own_account_deletion is
  'Self-service account deletion, step 1 of 2. SECURITY DEFINER so it can '
  'write across favourites/leads/properties regardless of the caller''s '
  'own RLS grants, but takes NO user_id parameter -- every write is '
  'scoped to auth.uid() internally, so a caller can never target another '
  'account, and admin accounts are explicitly refused. Scrubs both '
  'buyer_id-keyed leads and (0031) requester_id-keyed visitor-assistance '
  'leads. Step 2 (deleting the auth.users row) happens in server-side '
  'application code via the service role, only after this function '
  'returns successfully -- see src/lib/account/actions.ts.';

revoke all on function request_own_account_deletion() from public, anon;
grant execute on function request_own_account_deletion() to authenticated;
