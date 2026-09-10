-- 0007_properties_project_id.sql
-- Establishes the relationship between an individual property/listing and
-- the project (development) it may belong to, if any.
--
-- Scope: schema only. No UI, query, or RLS-policy-set changes beyond what
-- is strictly required to keep the new column exposed safely (see RLS note
-- below). Sellers do not gain any project-management capability from this
-- migration; project_id is just a nullable pointer they may set only on
-- their own property rows, same as any other property column they own.

alter table properties
  add column project_id uuid references projects (id) on delete set null;

comment on column properties.project_id is
  'Optional link to the developer-led project (see 0006_projects.sql) this '
  'listing belongs to. Nullable: most properties are independent, seller-'
  'owned listings with no parent project. ON DELETE SET NULL so removing a '
  'project can never cascade-delete a seller''s property.';

create index properties_project_id_idx on properties (project_id);

-- ===========================================================================
-- RLS
-- ===========================================================================
-- No RLS policy changes are made or needed here.
--
-- properties: the existing policies on `properties` (0002) are row-level,
-- not column-level — "sellers can update own properties" already lets an
-- owner update any column on their own row (using/with check both key off
-- auth.uid() = owner_id), and "published properties are public" already
-- lets anon/authenticated read every column of a published row, including
-- this new one. Postgres RLS has no per-column grant here, so adding a
-- nullable column to an already-covered table does not require a new
-- policy, and does not let a seller touch anything on `projects` itself —
-- that table's own admin-only policies (0006) are untouched.
--
-- projects: entirely unchanged. A seller can set properties.project_id to
-- point at a project, but that is a write to their own `properties` row,
-- not to `projects` — they still have no select/insert/update policy on
-- `projects` beyond the existing public "published projects are public"
-- read policy, and no write policy at all.
--
-- property_location / project_legal: untouched, not referenced by this
-- migration. Property location privacy is unaffected.
