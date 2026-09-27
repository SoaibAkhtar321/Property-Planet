-- 0036_property_public_location_visibility.sql
--
-- BUG: approx_lat/approx_lng/location_area/nearby_landmarks on the public
-- property detail page (Location.tsx, mapProperty.ts) render for the
-- property's own owner and for admins, but not for anyone else — even on
-- listings that genuinely have a property_location row with real data.
--
-- ROOT CAUSE: property_public has been declared
--   with (security_invoker = true)
-- since it was first created (0002), and every later redefinition (0017,
-- 0019, 0020, 0033) kept that option. security_invoker = true means the
-- view enforces RLS as the *querying* role, not the view owner. But
-- property_location's only SELECT policies are:
--   "owners can read own property location"   (auth.uid() = owner)
--   "admins can read all property locations"  (admin role)
-- There has never been a policy letting anyone else — a regular buyer, or
-- a logged-out visitor — read a property_location row, not even its safe
-- approximate columns. So property_public's `left join property_location`
-- silently returns null for location_area/nearby_landmarks/approx_lat/
-- approx_lng for every viewer except the owner or an admin, regardless of
-- publish status or whether the row exists. This has nothing to do with
-- which properties have a location saved — it depends entirely on who is
-- looking.
--
-- 0002's own comment describes the intended design accurately: exact_lat/
-- exact_lng/exact_address stay hidden because property_public's column
-- list structurally never selects them — not because property_location's
-- RLS is expected to filter row visibility for the view. That only works
-- if the view runs with the view owner's privileges (able to see every
-- property_location row) rather than re-applying the caller's own RLS on
-- top of the already-restrictive column list.
--
-- FIX: flip property_public back to the (default) security-definer-style
-- view behavior. This does not change what data is exposed — the column
-- list is untouched, so exact_lat/exact_lng/exact_address remain
-- structurally absent exactly as before, and reveal_exact_location() (0004)
-- remains the only path to them. It only lets the view's own join actually
-- see the safe approximate columns for every published property, for
-- every viewer, which is what it was always meant to do.

alter view property_public set (security_invoker = false);

comment on view property_public is
  'Public, RLS-safe projection of a published property. Runs as the view '
  'owner (security_invoker = false, 0036) so its left join to '
  'property_location can read location_area/nearby_landmarks/approx_lat/'
  'approx_lng for every viewer, not just the property owner or an admin — '
  'property_location''s own RLS was never meant to gate this view, only '
  'direct table access. exact_lat/exact_lng/exact_address remain '
  'structurally absent from the column list and are never exposed here. '
  'project_id separates Individual Properties (null) from Project Units '
  '(not null). is_featured (0020) exposes the admin-only Featured '
  'placement; because this view is gated on status = ''published'', an '
  'unpublished property can never appear publicly as Featured. '
  'price_unit/price_unit_label (0033) are NULL for any listing saved '
  'before that migration, rendering identically to a plain price.';