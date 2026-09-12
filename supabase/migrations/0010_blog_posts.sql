-- 0010_blog_posts.sql
-- Phase 6: real, admin-managed blog/content system.
--
-- Mirrors the `projects` pattern from 0006_projects.sql, scaled down to a
-- single table: blog posts are admin-authored editorial content, not
-- multi-seller like `properties`, so there is no seller/agent write path
-- here — only `admin` (via current_role_is('admin')) can write.
--
-- Same conventions as properties/projects:
--   * status enum (draft/pending/published/archived), no row deletion —
--     content is retired via status = 'archived', matching 0002/0006.
--   * a `blog_public` view is the only thing anon/authenticated ever
--     query — it structurally excludes draft/pending/archived rows by its
--     WHERE clause, not by app-level filtering.
--   * SEO fields live directly on the table, same decision as projects.
--
-- No seed data is inserted. Old template blog content
-- (src/data/inner-data/BlogData.ts, src/data/home-data/BlogData.ts and the
-- /blog_01 /blog_02 /blog_03 /blog_details pages/components) is unrelated
-- lorem-ipsum template output, not Property Planet content, and is left
-- alone/unlinked from navigation per the Phase 6 report — cleanup of those
-- files is Phase 8's job, not this migration's.

create type blog_post_status as enum ('draft', 'pending', 'published', 'archived');

create table blog_posts (
  id                     uuid primary key default gen_random_uuid(),
  -- Audit-only reference to the admin who created/manages the post. Not
  -- used for row visibility (that's current_role_is('admin') below) —
  -- posts aren't owned by individual users the way properties are.
  created_by             uuid references profiles (id) on delete set null,

  title                  text not null check (char_length(title) between 3 and 200),
  slug                   text not null unique,
  excerpt                text,
  content                text not null default '',
  featured_image_path    text,           -- path within the `blog-media` Storage bucket, not a public URL
  category               text,           -- free text, mirrors properties.property_type's convention — no fixed enum

  status                 blog_post_status not null default 'draft',

  seo_title              text,
  seo_description        text,
  og_image_path          text,           -- path within `blog-media`; falls back to featured_image_path when null
  reading_time_minutes   smallint check (reading_time_minutes is null or reading_time_minutes > 0),

  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  published_at           timestamptz
);

comment on table blog_posts is
  'Admin-authored real-estate content (plots/land, buying/selling guidance, '
  'documentation, location research). Admin-managed like projects — no '
  'seller write path.';
comment on column blog_posts.content is
  'Article body. Rendered as plain text/paragraphs by the current blog '
  'detail page — no rich-text/HTML sanitizer has been introduced in this '
  'phase, so admin-authored content is trusted the same way project '
  '`overview` text already is.';

create index blog_posts_status_idx on blog_posts (status) where status = 'published';
create index blog_posts_published_at_idx on blog_posts (published_at desc) where status = 'published';
create index blog_posts_category_idx on blog_posts (category);

create trigger blog_posts_set_updated_at
  before update on blog_posts
  for each row execute function set_updated_at();

-- Reuses the same generic set_published_at() defined in
-- 0002_properties_and_location.sql (it only reads new/old.status, so it
-- works unchanged against blog_post_status).
create trigger blog_posts_set_published_at
  before update on blog_posts
  for each row execute function set_published_at();

-- ===========================================================================
-- RLS
-- ===========================================================================

alter table blog_posts enable row level security;

create policy "published posts are public"
  on blog_posts for select
  using (status = 'published');

create policy "admins can read all posts"
  on blog_posts for select
  using (current_role_is('admin'));

create policy "admins can insert posts"
  on blog_posts for insert
  with check (current_role_is('admin'));

create policy "admins can update posts"
  on blog_posts for update
  using (current_role_is('admin'));

-- No delete policy — matches the properties/projects convention: content
-- is retired via status = 'archived', not row deletion.

-- ---------------------------------------------------------------------------
-- blog_public — the only view anon/buyer traffic should ever query for
-- /blog and /blog/[slug]. Mirrors property_public / project_public's shape
-- and intent.
-- ---------------------------------------------------------------------------

create view blog_public
  with (security_invoker = true) as
  select
    id,
    title,
    slug,
    excerpt,
    content,
    featured_image_path,
    category,
    seo_title,
    seo_description,
    og_image_path,
    reading_time_minutes,
    published_at
  from blog_posts
  where status = 'published';

grant select on blog_public to anon, authenticated;

comment on view blog_public is
  'RLS-safe public read surface for /blog and /blog/[slug]. Structurally '
  'excludes draft/pending/archived rows via the WHERE clause, and excludes '
  'created_by/status/created_at/updated_at (internal/admin bookkeeping) '
  'from the column list.';

-- ===========================================================================
-- Storage: blog media bucket
-- Separate bucket from `property-media` (0005) and `project-media` (0006),
-- keeping the same one-bucket-per-content-type convention. Path
-- convention: {post_id}/{filename}. Writes are admin-only — there is no
-- seller/author-owner concept for blog posts.
-- ===========================================================================

insert into storage.buckets (id, name, public)
values ('blog-media', 'blog-media', true)
on conflict (id) do nothing;

create policy "public read of blog media objects"
  on storage.objects for select
  using (bucket_id = 'blog-media');

create policy "admins can upload blog media objects"
  on storage.objects for insert
  with check (bucket_id = 'blog-media' and current_role_is('admin'));

create policy "admins can delete blog media objects"
  on storage.objects for delete
  using (bucket_id = 'blog-media' and current_role_is('admin'));
