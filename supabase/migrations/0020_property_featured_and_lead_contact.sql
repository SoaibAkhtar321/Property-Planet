-- 0020_property_featured_and_lead_contact.sql
--
-- Two genuinely-required additions. Everything else in this pass was built
-- on existing columns.
--
-- 1. properties.is_featured
--    `projects` has had is_featured since 0006 and the homepage Featured
--    section already reads it through project_public. There was no
--    equivalent for standalone properties, so an admin could not feature a
--    plot/villa — only a project. This adds the same flag, with the same
--    semantics: Featured is a PLACEMENT, not a move. Nothing about
--    status, ownership, project_id or location changes, so a featured
--    property keeps appearing in /properties exactly as before and is
--    additionally eligible for the homepage Featured section.
--
--    Write authorization: is_featured is admin-only. enforce_seller_
--    property_update() (0008, extended by 0017) already rejects seller
--    writes to any column outside the seller-editable allowlist and
--    exempts admins entirely, so adding the column WITHOUT adding it to
--    that allowlist is what makes it admin-only. The check below is
--    re-stated explicitly anyway so the intent survives future edits to
--    that function.
--
--    Public exposure: property_public gains is_featured so the public
--    Featured query can filter on it. property_public is
--    `where status = 'published'`, so a draft/pending/rejected/archived
--    property can never surface publicly as Featured even if the flag is
--    set on it — publication remains the gate, exactly as for projects.
--
-- 2. leads.contact_phone / preferred_date / preferred_time
--    The universal inquiry flow requires a phone number and accepts an
--    OPTIONAL preferred date and time. `leads` had neither. Phone could
--    not simply reuse profiles.phone: that is the account's phone, while
--    an enquiry may legitimately carry a different callback number, and
--    the admin Leads view needs the number as submitted with that
--    specific enquiry.
--
--    Date and time are deliberately separate nullable columns rather than
--    a timestamptz: the buyer is expressing a loose preference ("Tuesday",
--    "Tuesday morning"), and either half may be absent. site_visits.
--    scheduled_at stays the timestamptz for an actual confirmed visit —
--    this is not a second scheduling system, it is the optional hint that
--    rides along with the enquiry.

-- ===========================================================================
-- 1. properties.is_featured
-- ===========================================================================

alter table properties
  add column if not exists is_featured boolean not null default false;

comment on column properties.is_featured is
  'Admin-only Featured placement flag. Mirrors projects.is_featured (0006). '
  'Featured is an additional placement, never a move: it does not affect '
  'status, owner_id, project_id, location or /properties visibility. '
  'Seller writes are rejected by enforce_seller_property_update() because '
  'this column is not in that function''s seller-editable allowlist.';

-- Partial index: the public Featured query only ever asks for the true rows.
create index if not exists properties_featured_idx
  on properties (is_featured)
  where is_featured = true;

-- Explicit restatement of the admin-only rule. enforce_seller_property_update()
-- already blocks this by omission; this trigger states it directly so a future
-- edit to the allowlist cannot silently open it up.
create or replace function enforce_property_featured_admin_only()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if current_role_is('admin') then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if coalesce(new.is_featured, false) is distinct from false then
      raise exception 'is_featured can only be set by an admin';
    end if;
    return new;
  end if;

  if new.is_featured is distinct from old.is_featured then
    raise exception 'is_featured can only be changed by an admin';
  end if;

  return new;
end;
$$;

drop trigger if exists properties_featured_admin_only on properties;
create trigger properties_featured_admin_only
  before insert or update on properties
  for each row execute function enforce_property_featured_admin_only();

-- property_public: same definition as 0019, plus is_featured. Re-stated in
-- full (create or replace view cannot add a column otherwise) with the
-- `where status = 'published'` gate and the structural absence of
-- exact_lat/exact_lng/exact_address both unchanged.
create or replace view property_public
  with (security_invoker = true) as
  select
    p.id,
    p.title,
    p.slug,
    p.property_type,
    p.listing_type,
    p.price,
    p.area,
    p.area_unit,
    p.bedrooms,
    p.bathrooms,
    p.description,
    p.city,
    p.locality,
    p.published_at,
    pl.area          as location_area,
    pl.nearby_landmarks,
    pl.approx_lat,
    pl.approx_lng,
    p.project_id,
    p.is_featured
  from properties p
  left join property_location pl on pl.property_id = p.id
  where p.status = 'published';

comment on view property_public is
  'Public, RLS-safe projection of a published property. LEFT JOINed to '
  'property_location (0019) so publication status alone determines '
  'visibility. project_id separates Individual Properties (null) from '
  'Project Units (not null). is_featured (0020) exposes the admin-only '
  'Featured placement; because this view is gated on status = ''published'', '
  'an unpublished property can never appear publicly as Featured. '
  'exact_lat/exact_lng/exact_address remain structurally absent.';

-- ===========================================================================
-- 2. leads: enquiry contact + optional preferred slot
-- ===========================================================================

alter table leads
  add column if not exists contact_phone   text,
  add column if not exists preferred_date  date,
  add column if not exists preferred_time  time;

alter table leads
  drop constraint if exists leads_contact_phone_length;

alter table leads
  add constraint leads_contact_phone_length
  check (contact_phone is null or char_length(contact_phone) between 6 and 20);

comment on column leads.contact_phone is
  'Callback number submitted with this specific enquiry. Required by the '
  'application''s inquiry flow; nullable in the schema so the pre-0020 '
  'leads that predate the field remain valid rows.';
comment on column leads.preferred_date is
  'Optional buyer-preferred callback/visit date. NULL means "no preference" '
  '— the application never substitutes a placeholder date.';
comment on column leads.preferred_time is
  'Optional buyer-preferred callback/visit time. NULL means "no preference" '
  '— the application never substitutes a placeholder time.';

-- No RLS changes. The existing 0004 policies already govern `leads`:
-- buyers may INSERT their own row and SELECT their own rows, sellers may
-- read/update leads on their own properties, admins may do both. Adding
-- columns to the table does not widen any of those policies.
