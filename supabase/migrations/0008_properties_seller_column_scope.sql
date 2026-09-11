-- 0008_properties_seller_column_scope.sql
-- Phase 2 security fix.
--
-- PROBLEM: "sellers can update own properties" (0002) is a row-level
-- policy — using/with check both key off `auth.uid() = owner_id` only.
-- That lets an authenticated seller update ANY column on their own row,
-- including `status`, `owner_id`, and `published_at`. A seller could bypass
-- the UI entirely and run:
--     update properties set status = 'published' where id = '...';
-- and self-publish, self-reject, or mark their own listing sold — none of
-- which the business model allows (see project brief: moderation is
-- admin-only).
--
-- FIX: Postgres RLS policies can't compare OLD vs NEW in one expression
-- (USING only sees the old row, WITH CHECK only sees the new row), so
-- column-transition rules like "status may only move draft -> pending or
-- draft -> archived" can't be expressed as a policy. This migration adds a
-- BEFORE UPDATE trigger instead, which does have both OLD and NEW
-- available. RLS (0002) remains the first backstop — you must already own
-- the row to reach an UPDATE at all; this trigger is the second backstop
-- that then restricts *which columns and which status transitions* a
-- non-admin caller may apply to a row they do own.
--
-- Admins are exempt: they retain full moderation authority, matching
-- "admins can update any property" (0002) and the conceptual model in the
-- project brief (admin performs the moderation transitions).

create or replace function enforce_seller_property_update()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  -- Admins keep unrestricted update rights (moderation transitions,
  -- corrections, etc.) — this trigger only constrains non-admin callers.
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
  'owner_id or published_at, and may only move status draft -> pending or '
  'draft -> archived. Admins are exempt and keep full moderation rights.';

-- Name chosen to sort before the existing properties_set_* triggers
-- (0002) so this validation runs first; harmless either way since the
-- other triggers only touch updated_at/published_at based on the row
-- state this trigger has already validated or rejected.
create trigger properties_00_enforce_seller_scope
  before update on properties
  for each row execute function enforce_seller_property_update();
