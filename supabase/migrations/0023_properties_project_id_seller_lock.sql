-- 0023_properties_project_id_seller_lock.sql
-- Phase 6 security fix.
--
-- PROBLEM: "sellers can update own properties" (0002) is a row-level
-- policy only -- using/with check both key off auth.uid() = owner_id,
-- with no column-level restriction. The 0008 trigger
-- (enforce_seller_property_update) already locks owner_id,
-- published_at, and status transitions for non-admin callers, but never
-- touches project_id. 0007's own migration comment notes this
-- explicitly: "sellers do not gain any project-management capability
-- from this migration" was true of the UI at the time, but was never
-- enforced at the database layer -- a seller can bypass the app UI
-- entirely (same browser Supabase client already used for their own
-- media uploads) and run:
--     update properties set project_id = '<any project uuid>'
--     where id = '<own property>';
-- attaching their own listing to an admin-curated project it was never
-- approved as part of.
--
-- FIX: extend the existing 0008 trigger with the same pattern already
-- used for owner_id/published_at -- non-admin callers may not change
-- project_id at all; only an admin (via the admin property actions) may
-- attach/detach a property's project relationship.
--
-- Admins are exempt, matching every other column this trigger guards.
-- No RLS policy changes, no data migration, no change to the seller
-- create/update forms (which already never set project_id).

create or replace function enforce_seller_property_update()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  -- Admins keep unrestricted update rights (moderation transitions,
  -- corrections, project assignment, etc.) -- this trigger only
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

  -- project_id links a listing into an admin-curated project (0006/0007).
  -- That relationship is an admin/moderation decision, not something a
  -- seller can grant themselves or change on their own row -- a seller
  -- attaching their own listing to a project they were never approved
  -- into would misrepresent it as part of that development.
  if new.project_id is distinct from old.project_id then
    raise exception 'project_id can only be changed by an admin';
  end if;

  -- Seller-owned lifecycle: draft -> pending (submit for review) and
  -- draft -> archived (seller's removal mechanism -- see brief, no physical
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
  'moderation rights, including assigning/reassigning a property''s '
  'project_id (0023).';
