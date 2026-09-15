-- 0017_project_units.sql
-- Phases 2-5: public Individual Property separation + admin project-unit
-- management, on the EXISTING projects + properties.project_id
-- architecture. No units table is created: a unit is still a `properties`
-- row whose project_id points at its parent project (0007).
--
-- Three things are needed at the database level:
--
--   1. property_public must expose project_id, so the public
--      /properties listing can filter to `project_id is null`
--      (Individual Properties) without a second round-trip per row.
--      Adding a trailing column is the one shape `create or replace
--      view` allows, so the existing column list/order is preserved
--      exactly and no dependent object has to be dropped.
--
--   2. Non-admin callers must not be able to set or change
--      properties.project_id. 0007 deliberately added no policy for the
--      new column, and noted that "sellers can update own properties"
--      (0002) is row-level, so an owner could already write any column on
--      their own row — including project_id. That means a seller could
--      self-attach their listing to any project (silently removing it
--      from /properties and inserting it into a curated Featured
--      Opportunity), which Phase 5 explicitly forbids. RLS cannot express
--      this (no OLD-vs-NEW comparison in a policy, no per-column check on
--      INSERT), so it goes in the same trigger-backstop pattern 0008
--      already established.
--
--   3. Admin unit management needs no new privilege: "admins can insert
--      any property" (0016) and "admins can update any property" (0002)
--      already cover create/edit/attach/detach, and detach is an UPDATE
--      (project_id -> null), never a DELETE — so the "no physical delete"
--      convention from 0002/0006 is preserved and a detached unit keeps
--      its ownership, media, and lead history.

-- ===========================================================================
-- 1. property_public: expose project_id
-- ===========================================================================
-- Still an explicit column list; exact_lat/exact_lng/exact_address remain
-- structurally absent. project_id is not sensitive — it is already
-- readable on any published row through the "published properties are
-- public" policy on `properties`, and src/lib/leads/actions.ts already
-- reads it that way. Exposing it here only saves that extra query and
-- lets the public listing filter in SQL.

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
    p.project_id
  from properties p
  join property_location pl on pl.property_id = p.id
  where p.status = 'published';

comment on view property_public is
  'Public, RLS-safe projection of a published property. project_id is '
  'exposed so public listings can separate Individual Properties '
  '(project_id is null) from Project Units (project_id is not null); '
  'exact_lat/exact_lng/exact_address remain structurally absent.';

-- ===========================================================================
-- 2. project_id is admin-only on both INSERT and UPDATE
-- ===========================================================================

-- UPDATE: extend the existing 0008 trigger function rather than adding a
-- second BEFORE UPDATE trigger, so the ordering and the admin exemption
-- stay in one place. Body is otherwise byte-for-byte the 0008 version.
create or replace function enforce_seller_property_update()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  -- Admins keep unrestricted update rights (moderation transitions,
  -- project/unit management, corrections, etc.) — this trigger only
  -- constrains non-admin callers.
  if current_role_is('admin') then
    return new;
  end if;

  -- owner_id is never transferable by anyone but an admin (defense in
  -- depth on top of the RLS check, which already requires
  -- auth.uid() = owner_id on both the old and new row).
  if new.owner_id is distinct from old.owner_id then
    raise exception 'owner_id cannot be changed';
  end if;

  -- published_at is derived, not seller-settable. The only trigger that
  -- may set it is properties_set_published_at, and a non-admin can never
  -- drive a transition into 'published' (see status check below), so pin
  -- it to its previous value for non-admin callers.
  if new.published_at is distinct from old.published_at then
    raise exception 'published_at cannot be set directly';
  end if;

  -- project_id is a curation decision, not a listing attribute: attaching
  -- a property to a project removes it from the public Individual
  -- Properties listing and surfaces it inside an admin-curated project.
  -- Only an admin may attach or detach (both of which are exempted above).
  if new.project_id is distinct from old.project_id then
    raise exception 'project_id can only be changed by an admin';
  end if;

  -- Seller-owned lifecycle: draft -> pending (submit for review) and
  -- draft -> archived (seller's removal mechanism — see brief, no physical
  -- delete). Any other transition, including no-op edits to a non-draft
  -- row's status column, is a moderation action and belongs to admin only.
  if new.status is distinct from old.status then
    if old.status = 'draft' and new.status in ('pending', 'archived') then
      -- allowed
    else
      raise exception
        'sellers may only move a property from draft to pending or archived (attempted % -> %)',
        old.status, new.status;
    end if;
  end if;

  return new;
end;
$$;

comment on function enforce_seller_property_update is
  'BEFORE UPDATE trigger backstop for `properties`. RLS (0002) already '
  'restricts non-admin updates to rows the caller owns; this adds the '
  'column/transition-level restriction RLS cannot express (no OLD-vs-NEW '
  'comparison in a single policy): non-admin callers cannot change '
  'owner_id, published_at, or project_id, and may only move status '
  'draft -> pending or draft -> archived. Admins are exempt and keep full '
  'moderation and project/unit-management rights.';

-- INSERT: the 0008 trigger is BEFORE UPDATE only, so a seller could
-- otherwise create a brand-new listing already pointing at a project.
-- "sellers can insert own properties" (0002) is an RLS policy and cannot
-- constrain a single column's value the way this can.
create or replace function enforce_property_project_link_insert()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.project_id is not null and not current_role_is('admin') then
    raise exception 'project_id can only be set by an admin';
  end if;
  return new;
end;
$$;

comment on function enforce_property_project_link_insert is
  'BEFORE INSERT trigger backstop for `properties`: only an admin may '
  'create a row that is already attached to a project. Complements '
  'enforce_seller_property_update(), which covers the UPDATE path.';

create trigger properties_00_enforce_project_link_insert
  before insert on properties
  for each row execute function enforce_property_project_link_insert();

-- ===========================================================================
-- Explicitly NOT done here
-- ===========================================================================
-- * No units table, no duplicated property columns (a unit is a
--   `properties` row; project_id identifies its parent).
-- * No new columns for unit number / availability: the existing schema
--   already carries those as `title` and `status`, and the brief scopes
--   unit display to "where supported by the existing schema".
-- * No DELETE policy on `properties`. Detaching a unit is an UPDATE
--   setting project_id = null, so nothing is destroyed and ownership
--   semantics are unchanged.
-- * property_location, the reveal RPC, and every exact-location grant are
--   untouched.
