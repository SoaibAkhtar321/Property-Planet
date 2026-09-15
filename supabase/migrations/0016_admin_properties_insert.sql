-- 0016_admin_properties_insert.sql
-- Phase 1 (Admin Individual Property Listing).
--
-- PROBLEM: `properties` currently has no INSERT policy for admins — only
-- "sellers can insert own properties" (0002_properties_and_location.sql)
-- exists, and it is scoped to `current_role_is('seller')`. An
-- admin-authenticated insert is therefore rejected by RLS before it ever
-- reaches the app-level requireAdmin() check in
-- src/lib/admin/properties/actions.ts.
--
-- FIX: add the missing admin insert policy, mirroring "admins can update
-- any property" (0002) and "admins can insert projects" (0006): no
-- owner_id restriction for admin, since admin authority isn't row-scoped.
-- owner_id itself remains NOT NULL (schema, 0002) and is always set by the
-- calling server action from the admin's own auth-context userId — see
-- createAdminPropertyListing() — never trusted from client input, same as
-- the seller path.
create policy "admins can insert any property"
  on properties for insert
  with check (current_role_is('admin'));
