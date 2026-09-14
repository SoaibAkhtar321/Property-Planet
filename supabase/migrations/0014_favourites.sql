-- 0014_favourites.sql
--
-- Buyer/User dashboard: "Favourites" feature. No favourites table existed
-- anywhere in the schema, so this is a minimal, additive migration —
-- required because the dashboard Favourites section previously rendered
-- only static template data with no persistence at all.
--
-- Mirrors the existing leads/site_visits pattern: identity always
-- re-derived server-side (never trusted from the client), RLS scoped to
-- the owning buyer only, admin gets read access for support/moderation.

create table favourites (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references profiles (id) on delete cascade,
  property_id  uuid not null references properties (id) on delete cascade,
  created_at   timestamptz not null default now(),
  unique (user_id, property_id)
);

create index favourites_user_idx on favourites (user_id);
create index favourites_property_idx on favourites (property_id);

alter table favourites enable row level security;

create policy "users can read own favourites"
  on favourites for select
  using (auth.uid() = user_id);

create policy "admins can read all favourites"
  on favourites for select
  using (current_role_is('admin'));

create policy "users can add own favourites"
  on favourites for insert
  with check (auth.uid() = user_id);

create policy "users can remove own favourites"
  on favourites for delete
  using (auth.uid() = user_id);
