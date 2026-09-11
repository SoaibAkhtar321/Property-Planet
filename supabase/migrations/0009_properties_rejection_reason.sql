-- 0009_properties_rejection_reason.sql
-- Phase 4: admin property moderation needs somewhere to record *why* a
-- pending listing was rejected, so the seller (and future admin re-review)
-- has context beyond "status = rejected".
--
-- Scope: schema only, one nullable column. No RLS policy changes needed:
--   * "admins can update any property" (0002) already grants admins
--     unrestricted UPDATE on `properties`, so admins can write this column
--     through the existing policy.
--   * enforce_seller_property_update() (0008) exempts admins entirely
--     (`if current_role_is('admin') then return new; end if;`), so this
--     column is not touched by that trigger's transition checks for admin
--     writes.
--   * Non-admin callers (sellers) already cannot reach an UPDATE on a row
--     that isn't `draft` in a way that would let them set this column
--     anyway (0008 only allows draft -> pending / draft -> archived), so
--     no additional restriction is required to keep this seller-unwritable
--     in practice. Sellers CAN read it (existing "sellers can read own
--     properties any status" policy), which is desired — they should see
--     why their listing was rejected.

alter table properties
  add column rejection_reason text;

comment on column properties.rejection_reason is
  'Admin-supplied reason when status is set to rejected. Null otherwise. '
  'Writable in practice only by admins (see migration header) — no schema-level '
  'lock is added beyond the existing properties RLS/trigger stack, since '
  'sellers have no update path that could reach this column while rejected.';
