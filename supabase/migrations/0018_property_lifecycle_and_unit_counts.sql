-- 0018_property_lifecycle_and_unit_counts.sql
-- Phases 6-12.
--
-- Four things the application code in these phases genuinely cannot do
-- without a database change. Everything else in Phases 6-12 is application
-- code on top of the existing schema — no new tables, no duplicated
-- columns, no second enquiry or property system.
--
--   1. property_location: admins can read it (0002) but have no INSERT or
--      UPDATE policy. The only write policies are owner-scoped, so an
--      admin can manage the location of a property they created (they are
--      the owner) but NOT of a seller's listing. Phase 6 requires admin
--      location management across the moderation queue, so the missing
--      admin policies are added here, mirroring "admins can update any
--      property" (0002) and "admins can write project location" (0006).
--
--   2. property_media / storage.objects: same gap for media. 0002's write
--      policies and 0005's storage policies are both owner-scoped.
--
--   3. project_unit_counts: the public project page needs total vs
--      available unit counts. Only `published` units are readable under
--      "published properties are public" (0002), so a public caller
--      literally cannot count the sold/draft ones — the total would
--      silently equal the available count. A counts-only view solves this
--      without exposing a single non-published row.
--
--   4. An index supporting the Phase 7 public Individual Property search
--      (project_id is null + status filtering).
--
-- No policy here widens what a seller or buyer can do. Every addition is
-- gated on current_role_is('admin').

-- ===========================================================================
-- 1. property_location: admin write access
-- ===========================================================================

create policy "admins can write any property location"
  on property_location for insert
  with check (current_role_is('admin'));

create policy "admins can update any property location"
  on property_location for update
  using (current_role_is('admin'))
  with check (current_role_is('admin'));

-- ===========================================================================
-- 2. property_media: admin write access (table + storage objects)
-- ===========================================================================

create policy "admins can manage any property media"
  on property_media for insert
  with check (current_role_is('admin'));

create policy "admins can delete any property media"
  on property_media for delete
  using (current_role_is('admin'));

-- Storage counterpart. Path convention is unchanged: {property_id}/{file},
-- the same one 0005 established and that property_media.storage_path
-- records. The admin policies deliberately keep the bucket_id check but
-- drop the owner_id check — admin authority is not row-scoped.
create policy "admins can upload any property media objects"
  on storage.objects for insert
  with check (bucket_id = 'property-media' and current_role_is('admin'));

create policy "admins can delete any property media objects"
  on storage.objects for delete
  using (bucket_id = 'property-media' and current_role_is('admin'));

-- ===========================================================================
-- 3. project_unit_counts — aggregate-only, no row exposure
-- ===========================================================================
--
-- security_invoker is deliberately LEFT OFF here (so the view runs with its
-- definer's privileges and is not subject to the caller's RLS), which is
-- the opposite of property_public/project_public and needs justifying:
--
--   * Those views project actual property/project ROWS, so they must run
--     as the invoker or they would hand a buyer another user's row.
--   * This view projects nothing but three numbers per project:
--     project_id, total_units, available_units. No title, price, status,
--     owner, or location value can be read through it, and no per-row
--     information can be reconstructed from a pair of counts.
--   * It is restricted to projects that are already published, so it says
--     nothing at all about draft/archived projects.
--
-- Anything more than counts belongs in property_public, which is
-- published-only and invoker-scoped, and that is exactly where the public
-- unit LIST comes from (src/lib/projects/queries.ts getProjectUnits).

create view project_unit_counts as
  select
    p.project_id,
    count(*)                                           as total_units,
    count(*) filter (where p.status = 'published')     as available_units
  from properties p
  join projects pr on pr.id = p.project_id
  where pr.status = 'published'
  group by p.project_id;

comment on view project_unit_counts is
  'Aggregate unit counts per published project. Deliberately definer-'
  'scoped (no security_invoker) so it can count sold/draft units that a '
  'public caller cannot read individually. Exposes counts only — never a '
  'property row, status, price, owner, or location.';

grant select on project_unit_counts to anon, authenticated;

-- ===========================================================================
-- 4. Index for the public Individual Property search (Phase 7)
-- ===========================================================================
-- Partial on `project_id is null` because every public Individual Property
-- query carries that predicate (the Phase 2 separation invariant), so the
-- index only has to cover the rows those queries can ever return.

create index properties_individual_public_idx
  on properties (status, city, locality)
  where project_id is null;

-- ===========================================================================
-- Explicitly NOT done here
-- ===========================================================================
-- * No new tables. Units are still `properties` rows (0007); enquiries are
--   still `leads` rows (0004/0013).
-- * No change to any exact-location grant, to reveal_exact_location(), or
--   to property_public's column list — exact_lat/exact_lng/exact_address
--   remain unreachable from every public path.
-- * No new seller or buyer privilege of any kind.
