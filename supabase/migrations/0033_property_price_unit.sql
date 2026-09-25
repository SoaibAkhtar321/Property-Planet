-- 0033_property_price_unit.sql
--
-- Individual Properties price-unit selection (Phase: pricing UI polish).
--
-- `properties.price` has always been a bare numeric with no stated unit --
-- every listing implicitly meant "total price". Sellers/admins now need to
-- optionally say what the entered price actually represents (per sq. ft.,
-- per sq. yd., per sq. m., per acre, total, or a custom label), the way
-- `project_pricing` (0006_projects.sql) already does for Projects.
--
-- Existing-data rule: both new columns are nullable with no default and no
-- backfill. NULL means exactly what it means today -- "total price,
-- unlabeled" -- so every row that exists before this migration renders
-- identically after it. Only a listing saved through the new form (new,
-- or an existing one explicitly re-edited) ever gets a non-null value.
-- Nothing here converts, infers, or guesses a unit for existing rows.

do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_name = 'properties' and column_name = 'price_unit'
  ) then
    alter table properties add column price_unit text;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_name = 'properties' and column_name = 'price_unit_label'
  ) then
    alter table properties add column price_unit_label text;
  end if;
end $$;

-- price_unit is one of a fixed set, or NULL (today's unlabeled-total
-- behavior). 'custom' additionally requires price_unit_label to be set --
-- enforced below rather than at the check-constraint level, since a
-- cross-column condition here would need to also tolerate NULL price_unit
-- with a stray label, which is more naturally a single check.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'properties_price_unit_check'
  ) then
    alter table properties add constraint properties_price_unit_check
      check (
        price_unit is null
        or (
          price_unit in ('sqft', 'sqyd', 'sqm', 'acre', 'total', 'custom')
          and (price_unit <> 'custom' or price_unit_label is not null)
        )
      );
  end if;
end $$;

comment on column properties.price_unit is
  'What properties.price represents: sqft | sqyd | sqm | acre | total | custom, or NULL for pre-existing/unlabeled listings (treated as total price).';
comment on column properties.price_unit_label is
  'Free-text unit label, required and only used when price_unit = ''custom''.';

-- property_public (0002, last redefined in 0020): same definition, plus
-- price_unit/price_unit_label so the public detail/card/similar-properties
-- surfaces can render the unit. create or replace view can only append
-- columns, never insert/reorder them, so the two new columns are added at
-- the end (after is_featured), same as every previous redefinition of this
-- view (project_id in 0017, is_featured in 0020) appended rather than
-- inserted its new column(s).
create or replace view property_public
  with (security_invoker = true) as
  select
    p.id,
    p.title,
    p.slug,
    p.property_type,
    p.listing_type,
    p.price,
    p.area,
    p.area_unit,
    p.bedrooms,
    p.bathrooms,
    p.description,
    p.city,
    p.locality,
    p.published_at,
    pl.area          as location_area,
    pl.nearby_landmarks,
    pl.approx_lat,
    pl.approx_lng,
    p.project_id,
    p.is_featured,
    p.price_unit,
    p.price_unit_label
  from properties p
  left join property_location pl on pl.property_id = p.id
  where p.status = 'published';

comment on view property_public is
  'Public, RLS-safe projection of a published property. LEFT JOINed to '
  'property_location (0019) so publication status alone determines '
  'visibility. project_id separates Individual Properties (null) from '
  'Project Units (not null). is_featured (0020) exposes the admin-only '
  'Featured placement; because this view is gated on status = ''published'', '
  'an unpublished property can never appear publicly as Featured. '
  'price_unit/price_unit_label (0033) are NULL for any listing saved '
  'before this migration, rendering identically to today''s plain price. '
  'exact_lat/exact_lng/exact_address remain structurally absent.';
