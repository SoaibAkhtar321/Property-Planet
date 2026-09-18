-- 0026_property_publish_requires_location.sql
-- Launch-audit fix (Stage 2, item H2).
--
-- PROBLEM: the seller "Add Property" form only ever collects
-- city/locality on `properties` — it never creates a `property_location`
-- row (see PropertyLocation.tsx's own comment: exact/approx lat-lng is
-- out of scope for the seller form). property_location rows are only
-- ever written through the admin-only updateAdminPropertyLocation()
-- action, on a separate screen from Approve/Publish.
--
-- 0019_property_public_location_left_join.sql already fixed the
-- resulting *visibility* bug (a published property with no location row
-- was silently dropped from /properties by an inner join). But the
-- underlying gap is still open: nothing stops a property from reaching
-- status = 'published' with NO property_location row at all — meaning
-- reveal_exact_location() (0004) has nothing to return once a buyer's
-- site visit is confirmed, and the location accordion on the property
-- detail page has nothing to show even at the approximate level.
--
-- FIX: a BEFORE UPDATE trigger on `properties` that blocks the
-- transition INTO 'published' (from any other status) unless a matching
-- `property_location` row exists with exact_lat, exact_lng AND
-- exact_address all non-null. It does not touch INSERT (a property is
-- always created as 'draft', never published directly) and does not
-- touch any other status transition — draft/pending/rejected/archived
-- are all unaffected, and re-publishing/moderation transitions other
-- than "become published" are unaffected too.
--
-- This intentionally does NOT change who can write property_location —
-- an admin filling it in during moderation, exactly as today, is still
-- the expected path; this trigger only makes that step mandatory before
-- Approve/Publish can actually succeed, instead of optional.

create or replace function enforce_property_publish_requires_location()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_has_location boolean;
begin
  if new.status is distinct from 'published' then
    return new;
  end if;
  if old.status = 'published' then
    -- Already published, e.g. an unrelated field edit — not a new
    -- transition into 'published', so nothing to re-check here.
    return new;
  end if;

  select exists (
    select 1 from property_location pl
    where pl.property_id = new.id
      and pl.exact_lat is not null
      and pl.exact_lng is not null
      and pl.exact_address is not null
  ) into v_has_location;

  if not v_has_location then
    raise exception
      'This property cannot be published until its exact location (address, latitude and longitude) has been recorded in the admin Location tab.';
  end if;

  return new;
end;
$$;

comment on function enforce_property_publish_requires_location is
  'BEFORE UPDATE trigger backstop for `properties`. Blocks a transition '
  'into status = ''published'' unless a property_location row already '
  'exists with exact_lat, exact_lng and exact_address all set. Closes the '
  'gap where a seller-created listing (whose form never writes '
  'property_location) could go live with no recorded location at all, '
  'leaving reveal_exact_location() (0004) with nothing to reveal once a '
  'buyer''s site visit is confirmed.';

-- Runs after enforce_seller_property_update (0008/0017/0023), which is
-- named to sort first ("properties_00_..."); this one only needs to see
-- the already-validated NEW row, so ordering relative to that trigger
-- does not matter — it is named to sort after it for readability only.
create trigger properties_01_enforce_publish_requires_location
  before update on properties
  for each row execute function enforce_property_publish_requires_location();

-- ===========================================================================
-- INSERT path: an admin-created listing may be published directly at
-- creation time (src/lib/admin/properties/actions.ts, createAdminPropertyListing
-- with publishNow=true sets status: 'published' on the INSERT itself, not
-- via a later UPDATE) — the BEFORE UPDATE trigger above never fires for
-- that path, so it needs its own, INSERT-scoped check with the same rule.
-- property_location cannot exist yet for a brand-new row (its own FK
-- requires the property to already exist), so this path can only ever be
-- satisfied by NOT publishing directly at creation — which is the correct
-- outcome: even an admin-authored listing needs its location recorded
-- before it goes live, exactly like the UPDATE path enforces.
-- ===========================================================================

create or replace function enforce_property_insert_publish_requires_location()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.status = 'published' then
    raise exception
      'A new property cannot be published on creation before its exact location has been recorded. Save it as a draft, add its location, then publish.';
  end if;
  return new;
end;
$$;

comment on function enforce_property_insert_publish_requires_location is
  'BEFORE INSERT backstop for `properties`, pairing with '
  'enforce_property_publish_requires_location() above: a brand-new row '
  'can never have a property_location row yet (FK dependency), so '
  'publishing directly at creation is rejected outright rather than '
  'silently allowed to skip the location requirement.';

create trigger properties_01_enforce_insert_publish_requires_location
  before insert on properties
  for each row execute function enforce_property_insert_publish_requires_location();
