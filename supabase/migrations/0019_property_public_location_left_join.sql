-- 0019_property_public_location_left_join.sql
-- Bugfix: seller-created standalone properties never appeared on
-- /properties (Explore Properties) even after being approved and
-- published by an admin.
--
-- ROOT CAUSE: property_public (0002, extended in 0017) reads
--   from properties p
--   join property_location pl on pl.property_id = p.id
-- an INNER JOIN. The seller listing flow (src/lib/properties/actions.ts,
-- createPropertyListing) never inserts a property_location row — the
-- seller "Address & Location" form only writes properties.city/locality,
-- by design (see PropertyLocation.tsx comment: the exact/approx lat-lng
-- flow is out of scope for the seller form). property_location rows are
-- only ever written through the admin-only updateAdminPropertyLocation()
-- action (src/lib/admin/properties/actions.ts), on a separate part of the
-- admin property detail screen from the Approve/Publish buttons.
--
-- Admin-created properties happen to work today because an admin
-- typically fills in that same Location form for their own listing.
-- Nothing in the schema or the approve/publish action actually requires
-- it, so a seller property that is submitted, approved, and published
-- without an admin ever touching its Location form silently has no
-- property_location row — and the INNER JOIN drops it from every
-- property_public read, including the one behind /properties. This has
-- nothing to do with status/approval: the row's status is 'published',
-- but it is filtered out one join later.
--
-- FIX: change the join to a LEFT JOIN, so publication (`p.status =
-- 'published'`) remains the only visibility rule property_public
-- enforces, exactly as before. A property with no property_location row
-- simply reads back with null location_area/nearby_landmarks/approx_lat/
-- approx_lng, which the application already renders as optional data
-- (Property.mapEmbedUrl is optional and src/components/properties/detail/
-- Location.tsx already skips rendering when it is absent).
--
-- No RLS policy changes. No new columns/tables. No change to which rows
-- are published, who can publish them, or the project_id separation.

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
    p.project_id
  from properties p
  left join property_location pl on pl.property_id = p.id
  where p.status = 'published';

comment on view property_public is
  'Public, RLS-safe projection of a published property. LEFT JOINed to '
  'property_location (0019) so publication status alone determines '
  'visibility — a published property with no location row yet (e.g. a '
  'seller listing whose admin approver never filled in Location) still '
  'appears, with null location_area/nearby_landmarks/approx_lat/approx_lng. '
  'project_id separates Individual Properties (null) from Project Units '
  '(not null); exact_lat/exact_lng/exact_address remain structurally absent.';