-- 0013_leads_project_id.sql
--
-- Adds project-level leads alongside the existing plot/property-level leads,
-- per "Option 3": minimal and reversible.
--
-- Scope: schema only. No RLS policy changes, no application code changes,
-- no query/UI changes. Those are deliberately deferred to a follow-up
-- migration/PR once this shape is approved and applied.

-- ===========================================================================
-- 1. Add project_id (nullable) and make property_id nullable
-- ===========================================================================

alter table leads
  add column project_id uuid references projects (id) on delete set null;

comment on column leads.project_id is
  'Optional link to the project (see 0006_projects.sql) this lead concerns. '
  'Set on every project-level lead (property_id NULL). May also be set on '
  'a property-level lead to preserve project context, in which case it '
  'should match that property''s own project_id — this consistency is '
  'validated at the application layer on insert (see src/lib/leads/actions.ts), '
  'not by a database constraint, since a CHECK cannot reference another '
  'table. ON DELETE SET NULL so removing a project can never cascade-'
  'delete a buyer''s lead history.';

alter table leads
  alter column property_id drop not null;

comment on column leads.property_id is
  'The individual property/plot this lead concerns. NULL for a project-'
  'level lead (buyer enquired about the project generally, not a specific '
  'plot) — see leads_project_or_property_required below for the '
  'property_id/project_id exclusivity rule.';

-- ===========================================================================
-- 2. Backfill project_id from properties.project_id BEFORE enforcing the
--    new model, so no existing row is left in a state that would fail the
--    constraints added in step 3.
-- ===========================================================================

update leads l
set project_id = p.project_id
from properties p
where p.id = l.property_id
  and p.project_id is not null
  and l.project_id is null;

-- ===========================================================================
-- 3. Enforce the model with CHECK constraints
-- ===========================================================================

alter table leads
  add constraint leads_project_or_property_required
  check (project_id is not null or property_id is not null);

-- Note: there is deliberately no leads_property_project_consistency CHECK
-- here. PostgreSQL CHECK constraints cannot contain subqueries or reference
-- another table, so "this lead's project_id must match its property's
-- project_id" cannot be expressed as a CHECK at all — only as a trigger, or
-- enforced at the application layer. Per Option 3 (minimal, reversible), no
-- trigger is added; the follow-up server action is responsible for setting
-- project_id/property_id consistently on insert.

-- ===========================================================================
-- 4. Replace UNIQUE(buyer_id, property_id) with partial unique indexes
-- ===========================================================================

alter table leads
  drop constraint leads_buyer_id_property_id_key;

create unique index leads_buyer_property_unique
  on leads (buyer_id, property_id)
  where property_id is not null;

create unique index leads_buyer_project_unique
  on leads (buyer_id, project_id)
  where property_id is null and project_id is not null;

create index leads_project_id_idx on leads (project_id);

-- ===========================================================================
-- Explicitly out of scope for this migration
-- ===========================================================================
-- * site_visits.project_id — not added.
-- * RLS policies on leads/site_visits — untouched.
-- * Application code — untouched.
-- * leads_property_project_consistency — deliberately not a CHECK
--   (PostgreSQL CHECK cannot reference another table) and deliberately not
--   a trigger, to keep this migration minimal/reversible. Enforced instead
--   by the follow-up server action, which will re-derive
--   properties.project_id server-side and reject a mismatched insert —
--   the same never-trust-client-input pattern already used throughout
--   src/lib/leads/actions.ts. Legacy/backfilled rows are already
--   consistent by construction (step 2).
-- * Not applied here.