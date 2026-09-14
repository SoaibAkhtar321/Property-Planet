-- 0015_site_rera_certificate.sql
--
-- One site-wide RERA certificate, admin-managed, shown publicly on the
-- homepage (FeedbackOne / "second page" left column). Deliberately NOT
-- per-project: this is company-level trust content, not tied to any row
-- in `projects`. Singleton table, same "id boolean primary key check (id)"
-- trick used to guarantee at most one row without a separate uniqueness
-- migration.
--
-- Storage: reuses the existing `project-media` bucket and its existing
-- storage.objects policies from 0006_projects.sql (public read, admin-only
-- insert/delete) rather than creating a new bucket. Objects are written
-- under a `site/` prefix (e.g. site/<uuid>.pdf) to keep them out of any
-- project_id-scoped folder. No storage.objects changes needed here.

create table site_rera_certificate (
  id                boolean primary key default true check (id),
  storage_path      text,
  title             text,
  description       text,
  updated_at        timestamptz not null default now()
);

comment on table site_rera_certificate is
  'Single site-wide RERA certificate shown on the homepage. storage_path is '
  'null until an admin uploads a file — the public section renders nothing '
  'until then. title/description are optional admin-entered supporting '
  'copy; never fabricate a RERA number or registration text here.';

create trigger site_rera_certificate_set_updated_at
  before update on site_rera_certificate
  for each row execute function set_updated_at();

insert into site_rera_certificate (id) values (true);

alter table site_rera_certificate enable row level security;

create policy "site rera certificate is public"
  on site_rera_certificate for select
  using (true);

create policy "admins can update site rera certificate"
  on site_rera_certificate for update
  using (current_role_is('admin'));