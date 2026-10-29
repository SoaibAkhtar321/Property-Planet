-- 0038_ai_search_and_insights.sql
-- AI search layer + admin/seller insights.
--
--   1. property_embeddings      one vector per property (Gemini, 768 dims).
--                               Written only by the server (service role)
--                               after the app has authorised the change;
--                               never readable by clients.
--   2. match_published_properties()
--                               semantic ranking. Returns ONLY property ids
--                               + similarity, and only for rows that are
--                               already public (published, sale, not a
--                               project unit) — so it can't leak anything
--                               property_public doesn't already show.
--   3. property_search_log      what visitors searched for, how the AI read
--                               it and how many results came back. Written
--                               server-side only (no client insert path to
--                               spam), readable by admins.
--   4. ai_insight_cache         last generated AI summary per admin/seller.
--   5. seller_search_demand()   aggregate demand for the caller's own
--                               localities — counts only, never queries.
--
-- Requires the pgvector extension (enabled below; available on every
-- Supabase project).

create schema if not exists extensions;
create extension if not exists vector with schema extensions;
-- Supabase already grants this; stated so callers of the vector-typed RPC
-- below work on any Postgres.
grant usage on schema extensions to anon, authenticated;

-- ===========================================================================
-- 1. property_embeddings
-- ===========================================================================

create table if not exists property_embeddings (
  property_id   uuid primary key references properties (id) on delete cascade,
  embedding     extensions.vector(768) not null,
  -- sha256 of the text that was embedded; lets the app skip re-embedding
  -- when nothing searchable changed.
  content_hash  text not null,
  model         text not null,
  updated_at    timestamptz not null default now()
);

comment on table property_embeddings is
  'Semantic search vectors (0038). Server-only: written with the service '
  'role after app-level authorisation, read only through '
  'match_published_properties(). No client policies by design.';

create index if not exists property_embeddings_hnsw
  on property_embeddings using hnsw (embedding extensions.vector_cosine_ops);

alter table property_embeddings enable row level security;
revoke all on property_embeddings from anon, authenticated;

-- ===========================================================================
-- 2. match_published_properties()
-- ===========================================================================

create or replace function match_published_properties(
  p_query_embedding extensions.vector(768),
  p_match_count     integer default 60,
  p_min_similarity  double precision default 0.25
)
returns table (property_id uuid, similarity double precision)
language sql
stable
security definer
set search_path = public, extensions
as $$
  select e.property_id,
         1 - (e.embedding <=> p_query_embedding) as similarity
  from property_embeddings e
  join properties p on p.id = e.property_id
  where p.status = 'published'
    and p.listing_type = 'sale'
    and p.project_id is null
    and 1 - (e.embedding <=> p_query_embedding) >= greatest(p_min_similarity, 0)
  order by e.embedding <=> p_query_embedding
  limit least(greatest(coalesce(p_match_count, 60), 1), 200);
$$;

comment on function match_published_properties is
  'Semantic search (0038). SECURITY DEFINER only to read the server-only '
  'property_embeddings table; returns nothing but ids + similarity of '
  'listings that are already public (published, sale, not a project unit).';

revoke all on function match_published_properties(extensions.vector, integer, double precision) from public;
grant execute on function match_published_properties(extensions.vector, integer, double precision) to anon, authenticated;

-- ===========================================================================
-- 3. property_search_log
-- ===========================================================================

create table if not exists property_search_log (
  id            bigint generated always as identity primary key,
  query         text not null check (char_length(query) between 1 and 200),
  -- the structured filters the AI extracted (type, locality, price...).
  interpreted   jsonb check (interpreted is null or pg_column_size(interpreted) <= 4000),
  result_count  integer not null check (result_count >= 0),
  used_ai       boolean not null default false,
  created_at    timestamptz not null default now()
);

comment on table property_search_log is
  'Public property searches (0038) for demand insights. Contains no user '
  'id, IP or contact data. Inserted server-side with the service role '
  'only; admins can read it.';

create index if not exists property_search_log_created_idx on property_search_log (created_at desc);

alter table property_search_log enable row level security;
revoke all on property_search_log from anon, authenticated;
grant select on property_search_log to authenticated;

create policy "admins can read search log"
  on property_search_log for select
  using (current_role_is('admin'));

-- ===========================================================================
-- 4. ai_insight_cache
-- ===========================================================================

create table if not exists ai_insight_cache (
  scope        text not null check (scope in ('admin', 'seller')),
  -- 'admin' for the admin summary, the seller's uuid for a seller's.
  subject_id   text not null,
  payload      jsonb not null check (pg_column_size(payload) <= 20000),
  model        text,
  created_at   timestamptz not null default now(),
  primary key (scope, subject_id)
);

comment on table ai_insight_cache is
  'Latest AI-written insight summary per admin/seller (0038). Written by '
  'the server (service role) after authorisation; readable by the admin '
  '(scope admin) or the owning seller (scope seller).';

alter table ai_insight_cache enable row level security;
revoke all on ai_insight_cache from anon, authenticated;
grant select on ai_insight_cache to authenticated;

create policy "admins read admin insights"
  on ai_insight_cache for select
  using (scope = 'admin' and current_role_is('admin'));

create policy "sellers read own insights"
  on ai_insight_cache for select
  using (scope = 'seller' and subject_id = auth.uid()::text);

-- ===========================================================================
-- 5. seller_search_demand()
-- ===========================================================================
-- For each locality the caller has a listing in, how many searches in the
-- last p_days mentioned it (in the AI-extracted locality, or in the raw
-- query text). Aggregates only: a seller never sees what anyone typed.

create or replace function seller_search_demand(p_days integer default 30)
returns table (locality text, searches bigint)
language sql
stable
security definer
set search_path = public
as $$
  with mine as (
    select distinct lower(btrim(p.locality)) as loc
    from properties p
    where p.owner_id = auth.uid()
      and p.locality is not null
      and btrim(p.locality) <> ''
  )
  select m.loc as locality,
         count(s.id) as searches
  from mine m
  left join property_search_log s
    on s.created_at > now() - make_interval(days => least(greatest(coalesce(p_days, 30), 1), 365))
   and (
         lower(coalesce(s.interpreted ->> 'locality', '')) = m.loc
         or position(m.loc in lower(s.query)) > 0
       )
  group by m.loc
  order by searches desc, m.loc;
$$;

comment on function seller_search_demand is
  'Seller insight (0038): search volume for the caller''s own listing '
  'localities. Returns counts only, never query text.';

revoke all on function seller_search_demand(integer) from public, anon;
grant execute on function seller_search_demand(integer) to authenticated;
