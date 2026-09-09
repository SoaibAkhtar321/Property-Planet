-- 0006_projects.sql
-- FCity/Property Planet Phase 5: real-estate "Projects" database architecture.
--
-- A "project" is a developer-led plotted development / township, distinct
-- from a "property" (an individual seller's listing). Projects are
-- centrally content-managed (admin-only writes) rather than multi-seller,
-- so — unlike `properties` — there is no `seller` write path here: the
-- existing `user_role` enum only has buyer/seller/admin, and only `admin`
-- is meaningful for managing project content.
--
-- DESIGN NOTE ON LOCATION PRIVACY (per Phase 5 brief, item 2):
-- `property_location` splits exact vs. approximate coordinates because a
-- property's exact_address belongs to an individual seller and must not be
-- exposed until a qualifying lead/site-visit (see 0002/0004). A project is
-- a developer-marketed development — its location is meant to be publicly
-- known, the same way a project's brochure would print an address — so
-- `project_location` does NOT need an exact/approximate split, and this
-- migration does not touch or weaken the existing property_location
-- privacy model in any way. Coordinates here are simply nullable until
-- verified, never fabricated, and only ever public.

-- ===========================================================================
-- Enums
-- ===========================================================================

-- Separate from `property_status`: projects don't have "rejected"/"sold"
-- states the way an individual property does, so this is its own type
-- rather than a reuse that would carry unrelated values.
create type project_status as enum ('draft', 'pending', 'published', 'archived');

-- ===========================================================================
-- projects — the parent record
-- ===========================================================================

create table projects (
  id                uuid primary key default gen_random_uuid(),
  -- Audit-only reference to the admin who created/manages the record.
  -- Not used for row visibility (that's current_role_is('admin') below) —
  -- projects aren't owned by individual users the way properties are.
  created_by        uuid references profiles (id) on delete set null,

  title             text not null check (char_length(title) between 3 and 200),
  slug              text not null unique,
  tag               text,                 -- short display label, e.g. "Plotted Development"
  developer         text,
  project_type      text,                 -- free text, mirrors properties.property_type's convention

  -- Verified, structured "size" facts only — never invented. Nullable until
  -- confirmed. e.g. total_area = 17, total_area_unit = 'acre' for the one
  -- currently-verified Property Planet project.
  total_area        numeric(12, 2),
  total_area_unit   text,

  overview          text,

  status            project_status not null default 'draft',
  is_featured       boolean not null default false,
  is_new_arrival    boolean not null default false,
  display_priority  integer not null default 0,

  -- SEO lives directly on projects per the established decision — no
  -- separate SEO table.
  seo_title         text,
  seo_description   text,

  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  published_at      timestamptz
);

comment on table projects is
  'Developer-led real-estate projects/developments. Admin-managed content, '
  'not multi-seller like properties — see file header for why there is no '
  'seller write path here.';
comment on column projects.total_area is
  'Verified whole-project size only (e.g. 17 for a 17-acre development). '
  'Leave null rather than estimate; use project_area_distribution for any '
  'verified category breakdown.';

create index projects_status_idx on projects (status) where status = 'published';
create index projects_ordering_idx on projects (display_priority, published_at desc)
  where status = 'published';
create index projects_featured_idx on projects (is_featured) where is_featured = true;
create index projects_new_arrival_idx on projects (is_new_arrival) where is_new_arrival = true;

create trigger projects_set_updated_at
  before update on projects
  for each row execute function set_updated_at();

-- Reuses the same generic set_published_at() defined in
-- 0002_properties_and_location.sql (it only reads new/old.status, so it
-- works unchanged against project_status).
create trigger projects_set_published_at
  before update on projects
  for each row execute function set_published_at();

-- ===========================================================================
-- project_location — 1:1, public (see design note above)
-- ===========================================================================

create table project_location (
  project_id   uuid primary key references projects (id) on delete cascade,
  city         text,
  locality     text,
  address      text,             -- public: a project's marketed address, not a private seller address
  lat          double precision,
  lng          double precision
);

comment on table project_location is
  'Public project location. Unlike property_location there is no exact/'
  'approximate split — a project''s address is meant to be publicly known. '
  'All columns nullable until verified; never populate with invented coordinates.';

-- ===========================================================================
-- project_landmarks — repeatable, nearby places
-- ===========================================================================

create table project_landmarks (
  id             uuid primary key default gen_random_uuid(),
  project_id     uuid not null references projects (id) on delete cascade,
  name           text not null,
  category       text,           -- e.g. 'school', 'hospital', 'shopping' — free text, not a fixed enum
  distance_label text,           -- e.g. "2.5 km" — display string, kept free-form since units vary
  display_order  smallint not null default 0,
  created_at     timestamptz not null default now()
);

create index project_landmarks_project_idx on project_landmarks (project_id, display_order);

-- ===========================================================================
-- project_connectivity — repeatable, roads/transport/airport/etc.
-- ===========================================================================

create table project_connectivity (
  id             uuid primary key default gen_random_uuid(),
  project_id     uuid not null references projects (id) on delete cascade,
  type           text not null,  -- e.g. 'road', 'highway', 'metro', 'rail', 'airport'
  name           text not null,
  distance_label text,
  display_order  smallint not null default 0,
  created_at     timestamptz not null default now()
);

create index project_connectivity_project_idx on project_connectivity (project_id, display_order);

-- ===========================================================================
-- project_features — repeatable, admin add/remove/reorder
-- ===========================================================================

create table project_features (
  id             uuid primary key default gen_random_uuid(),
  project_id     uuid not null references projects (id) on delete cascade,
  title          text not null,
  description    text,
  icon           text,           -- icon name/asset path, optional
  display_order  smallint not null default 0,
  created_at     timestamptz not null default now()
);

create index project_features_project_idx on project_features (project_id, display_order);

-- ===========================================================================
-- project_area_distribution — repeatable land-use breakdown
-- ===========================================================================

create table project_area_distribution (
  id             uuid primary key default gen_random_uuid(),
  project_id     uuid not null references projects (id) on delete cascade,
  category       text not null,   -- e.g. "Residential Plots", "Green Space", "Roads & Infrastructure"
  value          numeric(12, 2),
  unit           text,            -- e.g. 'acre', 'sqft', '%'
  percentage     numeric(5, 2) check (percentage is null or (percentage >= 0 and percentage <= 100)),
  display_order  smallint not null default 0,
  created_at     timestamptz not null default now()
);

create index project_area_distribution_project_idx on project_area_distribution (project_id, display_order);

comment on table project_area_distribution is
  'Repeatable, admin-defined land-use breakdown. No figures are seeded — '
  'every row must come from verified project data.';

-- ===========================================================================
-- project_pricing — repeatable, not a single hard-coded price format
-- ===========================================================================

create table project_pricing (
  id             uuid primary key default gen_random_uuid(),
  project_id     uuid not null references projects (id) on delete cascade,
  label          text not null,    -- e.g. "Starting Price", "Price per Sq. Yd."
  price          numeric(14, 2),
  price_unit     text,             -- e.g. 'per_sqyd', 'per_acre', 'total'
  currency       text not null default 'INR',
  note           text,
  display_order  smallint not null default 0,
  created_at     timestamptz not null default now()
);

create index project_pricing_project_idx on project_pricing (project_id, display_order);

comment on table project_pricing is
  'Repeatable pricing rows so different projects (or plot sizes within a '
  'project) can carry different pricing shapes. No pricing is seeded — '
  'Property Planet pricing has not been confirmed.';

-- ===========================================================================
-- project_media — unified media table (gallery/master plan/floor plan/video/doc)
-- ===========================================================================

create table project_media (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid not null references projects (id) on delete cascade,
  storage_path  text not null,    -- path within the `project-media` Storage bucket, not a public URL
  media_type    text not null check (media_type in ('gallery', 'master_plan', 'floor_plan', 'video', 'document')),
  is_primary    boolean not null default false,
  caption       text,
  sort_order    smallint not null default 0,
  created_at    timestamptz not null default now()
);

create index project_media_project_idx on project_media (project_id, media_type, sort_order);

-- At most one primary media item per project — mirrors the "identify a
-- featured/primary item" requirement without a separate flag table.
create unique index project_media_one_primary_idx on project_media (project_id)
  where is_primary = true;

-- ===========================================================================
-- project_legal — verified compliance info only; nothing pre-filled
-- ===========================================================================

create table project_legal (
  project_id            uuid primary key references projects (id) on delete cascade,
  rera_number           text,
  approvals             text,
  registration_details  text,
  possession_status     text,
  notes                 text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

comment on table project_legal is
  'Compliance/legal fields for a project. Every column is nullable and '
  'intentionally left empty until genuinely verified — do not populate '
  'with placeholder RERA numbers, approvals, or possession claims.';

create trigger project_legal_set_updated_at
  before update on project_legal
  for each row execute function set_updated_at();

-- ===========================================================================
-- RLS
-- ===========================================================================

alter table projects enable row level security;
alter table project_location enable row level security;
alter table project_landmarks enable row level security;
alter table project_connectivity enable row level security;
alter table project_features enable row level security;
alter table project_area_distribution enable row level security;
alter table project_pricing enable row level security;
alter table project_media enable row level security;
alter table project_legal enable row level security;

-- --- projects ---------------------------------------------------------

create policy "published projects are public"
  on projects for select
  using (status = 'published');

create policy "admins can read all projects"
  on projects for select
  using (current_role_is('admin'));

create policy "admins can insert projects"
  on projects for insert
  with check (current_role_is('admin'));

create policy "admins can update projects"
  on projects for update
  using (current_role_is('admin'));

-- No delete policy, matching the `properties` convention (0002): content is
-- retired via status = 'archived', not row deletion.

-- --- project_location (public 1:1; see design note at top of file) ----

create policy "project location is public when project is published"
  on project_location for select
  using (
    exists (
      select 1 from projects p
      where p.id = project_location.project_id and p.status = 'published'
    )
  );

create policy "admins can read all project locations"
  on project_location for select
  using (current_role_is('admin'));

create policy "admins can write project location"
  on project_location for insert
  with check (current_role_is('admin'));

create policy "admins can update project location"
  on project_location for update
  using (current_role_is('admin'));

-- --- repeatable child tables: landmarks, connectivity, features, -------
-- --- area_distribution, pricing — same visibility/write shape ---------

create policy "project landmarks follow project visibility"
  on project_landmarks for select
  using (
    exists (
      select 1 from projects p
      where p.id = project_landmarks.project_id
        and (p.status = 'published' or current_role_is('admin'))
    )
  );
create policy "admins can manage project landmarks"
  on project_landmarks for insert with check (current_role_is('admin'));
create policy "admins can update project landmarks"
  on project_landmarks for update using (current_role_is('admin'));
create policy "admins can delete project landmarks"
  on project_landmarks for delete using (current_role_is('admin'));

create policy "project connectivity follows project visibility"
  on project_connectivity for select
  using (
    exists (
      select 1 from projects p
      where p.id = project_connectivity.project_id
        and (p.status = 'published' or current_role_is('admin'))
    )
  );
create policy "admins can manage project connectivity"
  on project_connectivity for insert with check (current_role_is('admin'));
create policy "admins can update project connectivity"
  on project_connectivity for update using (current_role_is('admin'));
create policy "admins can delete project connectivity"
  on project_connectivity for delete using (current_role_is('admin'));

create policy "project features follow project visibility"
  on project_features for select
  using (
    exists (
      select 1 from projects p
      where p.id = project_features.project_id
        and (p.status = 'published' or current_role_is('admin'))
    )
  );
create policy "admins can manage project features"
  on project_features for insert with check (current_role_is('admin'));
create policy "admins can update project features"
  on project_features for update using (current_role_is('admin'));
create policy "admins can delete project features"
  on project_features for delete using (current_role_is('admin'));

create policy "project area distribution follows project visibility"
  on project_area_distribution for select
  using (
    exists (
      select 1 from projects p
      where p.id = project_area_distribution.project_id
        and (p.status = 'published' or current_role_is('admin'))
    )
  );
create policy "admins can manage project area distribution"
  on project_area_distribution for insert with check (current_role_is('admin'));
create policy "admins can update project area distribution"
  on project_area_distribution for update using (current_role_is('admin'));
create policy "admins can delete project area distribution"
  on project_area_distribution for delete using (current_role_is('admin'));

create policy "project pricing follows project visibility"
  on project_pricing for select
  using (
    exists (
      select 1 from projects p
      where p.id = project_pricing.project_id
        and (p.status = 'published' or current_role_is('admin'))
    )
  );
create policy "admins can manage project pricing"
  on project_pricing for insert with check (current_role_is('admin'));
create policy "admins can update project pricing"
  on project_pricing for update using (current_role_is('admin'));
create policy "admins can delete project pricing"
  on project_pricing for delete using (current_role_is('admin'));

-- --- project_media (mirrors property_media's visibility pattern) ------

create policy "project media follows project visibility"
  on project_media for select
  using (
    exists (
      select 1 from projects p
      where p.id = project_media.project_id
        and (p.status = 'published' or current_role_is('admin'))
    )
  );
create policy "admins can manage project media"
  on project_media for insert with check (current_role_is('admin'));
create policy "admins can update project media"
  on project_media for update using (current_role_is('admin'));
create policy "admins can delete project media"
  on project_media for delete using (current_role_is('admin'));

-- --- project_legal (admin-only in both directions; never public) ------

create policy "admins can read project legal info"
  on project_legal for select
  using (current_role_is('admin'));
create policy "admins can write project legal info"
  on project_legal for insert with check (current_role_is('admin'));
create policy "admins can update project legal info"
  on project_legal for update using (current_role_is('admin'));

-- ---------------------------------------------------------------------------
-- project_public — the only view anon/buyer traffic should query for
-- listing/detail pages. Mirrors property_public's shape and intent.
-- ---------------------------------------------------------------------------

create view project_public
  with (security_invoker = true) as
  select
    p.id,
    p.title,
    p.slug,
    p.tag,
    p.developer,
    p.project_type,
    p.total_area,
    p.total_area_unit,
    p.overview,
    p.is_featured,
    p.is_new_arrival,
    p.display_priority,
    p.seo_title,
    p.seo_description,
    p.published_at,
    pl.city,
    pl.locality,
    pl.address,
    pl.lat,
    pl.lng
  from projects p
  left join project_location pl on pl.project_id = p.id
  where p.status = 'published';

grant select on project_public to anon, authenticated;

comment on view project_public is
  'RLS-safe public read surface for /projects and /projects/[slug]. '
  'Deliberately excludes project_legal entirely (rera_number, approvals, '
  'etc. are admin-only) — join in project_landmarks / project_connectivity /'
  'project_features / project_area_distribution / project_pricing / '
  'project_media separately, each already gated by its own '
  '"...follows project visibility" policy above.';

-- ===========================================================================
-- Storage: project media bucket
-- Separate bucket from `property-media` (0005) to keep the same
-- table/bucket separation of concerns as the rest of this schema. Path
-- convention: {project_id}/{filename}, matching project_media.storage_path.
-- Unlike property-media, writes are admin-only — there is no seller-owner
-- concept for projects.
-- ===========================================================================

insert into storage.buckets (id, name, public)
values ('project-media', 'project-media', true)
on conflict (id) do nothing;

create policy "public read of project media objects"
  on storage.objects for select
  using (bucket_id = 'project-media');

create policy "admins can upload project media objects"
  on storage.objects for insert
  with check (bucket_id = 'project-media' and current_role_is('admin'));

create policy "admins can delete project media objects"
  on storage.objects for delete
  using (bucket_id = 'project-media' and current_role_is('admin'));

-- ===========================================================================
-- NOTE: no seed data is inserted by this migration.
--
-- The only verified Property Planet project facts (title "Property Planet",
-- developer "Elite Infra Group", location "Kongara Khurd-A, South
-- Hyderabad", size "17-acre plotted development") are already represented
-- in src/components/projects/data/demoProjects.ts per the Phase 5 scope,
-- which explicitly keeps the canonical /projects pages on static data for
-- now. Inserting a seed row here would create a second, divorced copy of
-- that same information with no consumer yet — the migration architecture
-- stands on its own without it, per the brief's "do not create unnecessary
-- seed data" guidance.
-- ===========================================================================
