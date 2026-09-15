import { createClient } from "@/lib/supabase/server";
import { Property } from "@/components/properties/data/types";
import { mapProperty, propertyMediaPublicUrl, PropertyMediaRow, PropertyPublicRow } from "./mapProperty";

const PROPERTY_PUBLIC_COLUMNS =
   "id, title, slug, property_type, listing_type, price, area, area_unit, bedrooms, bathrooms, description, city, locality, published_at, location_area, nearby_landmarks, approx_lat, approx_lng, project_id";

async function attachMedia(supabase: Awaited<ReturnType<typeof createClient>>, rows: PropertyPublicRow[]): Promise<Property[]> {
   if (rows.length === 0) return [];

   const ids = rows.map((row) => row.id);
   const { data: mediaRows, error: mediaError } = await supabase
      .from("property_media")
      .select("id, property_id, storage_path, media_type, sort_order")
      .in("property_id", ids);

   if (mediaError) {
      // Media is enhancement, not the source of truth for whether a
      // property exists — log and continue with an empty media set rather
      // than failing the whole page.
      console.error("Failed to load property_media:", mediaError.message);
   }

   const mediaByProperty = new Map<string, PropertyMediaRow[]>();
   for (const media of mediaRows ?? []) {
      const list = mediaByProperty.get(media.property_id) ?? [];
      list.push(media as PropertyMediaRow);
      mediaByProperty.set(media.property_id, list);
   }

   return rows.map((row) => {
      const media = (mediaByProperty.get(row.id) ?? []).map((m) => ({
         publicUrl: propertyMediaPublicUrl(supabase, m.storage_path),
         media_type: m.media_type,
         sort_order: m.sort_order,
      }));
      return mapProperty(row, media);
   });
}

/**
 * All published *Individual Properties*, newest first. Used by /properties.
 *
 * `project_id is null` is the separation rule (0007): a row with a
 * project_id is a Project Unit/Plot and belongs only inside its parent
 * Project's detail page, never in the standalone public listing. The
 * filter is applied here rather than in the view so that
 * getPropertyBySlug() — and therefore the unit's own detail page, which
 * the Project -> Units flow links to — keeps working unchanged.
 */
export async function getPublishedProperties(): Promise<Property[]> {
   const supabase = await createClient();

   const { data, error } = await supabase
      .from("property_public")
      .select(PROPERTY_PUBLIC_COLUMNS)
      .is("project_id", null)
      .order("published_at", { ascending: false });

   if (error) {
      console.error("Failed to load properties:", error.message);
      return [];
   }

   return attachMedia(supabase, (data ?? []) as PropertyPublicRow[]);
}

/** A single published property by slug, or null if it doesn't exist/isn't published. */
export async function getPropertyBySlug(slug: string): Promise<Property | null> {
   const supabase = await createClient();

   const { data, error } = await supabase
      .from("property_public")
      .select(PROPERTY_PUBLIC_COLUMNS)
      .eq("slug", slug)
      .maybeSingle();

   if (error) {
      console.error("Failed to load property:", error.message);
      return null;
   }
   if (!data) return null;

   const [mapped] = await attachMedia(supabase, [data as PropertyPublicRow]);

   // Phase 16/18: if this listing is a Project Unit, resolve its parent
   // project so the detail page can label it and link back. Read through
   // `project_public` (published-only) so an unpublished project is simply
   // not named rather than leaked — the unit itself stays viewable.
   if (mapped.projectId) {
      const { data: project } = await supabase
         .from("project_public")
         .select("id, title, slug")
         .eq("id", mapped.projectId)
         .maybeSingle();

      if (project) {
         mapped.project = { id: project.id, title: project.title, slug: project.slug };
      }
   }

   return mapped;
}

/**
 * Up to `limit` other published Individual Properties of the same
 * property_type. Project Units are excluded for the same reason they are
 * excluded from /properties — a unit is discovered through its project,
 * not as a standalone listing.
 */
export async function getSimilarProperties(property: Property, limit = 2): Promise<Property[]> {
   const supabase = await createClient();

   // A Project Unit's peers are the other units of the same project, not
   // unrelated standalone listings — showing Individual Properties here
   // would send a buyer out of the project flow entirely. An Individual
   // Property keeps the `project_id is null` invariant.
   let query = supabase.from("property_public").select(PROPERTY_PUBLIC_COLUMNS).neq("slug", property.slug);

   query = property.projectId
      ? query.eq("project_id", property.projectId)
      : query.eq("property_type", property.propertyType.toLowerCase()).is("project_id", null);

   const { data, error } = await query.order("published_at", { ascending: false }).limit(limit);

   if (error) {
      console.error("Failed to load similar properties:", error.message);
      return [];
   }

   return attachMedia(supabase, (data ?? []) as PropertyPublicRow[]);
}

/**
 * Every property the given user has favourited, newest-favourited first.
 * Used by the Buyer/User dashboard Favourites page. Reads through
 * `property_public` (not `properties`) so a favourite on a listing that
 * has since been unpublished silently drops off the list rather than
 * erroring or leaking a non-public row.
 */
export async function getFavouriteProperties(userId: string): Promise<Property[]> {
   const supabase = await createClient();

   const { data: favourites, error: favouritesError } = await supabase
      .from("favourites")
      .select("property_id")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

   if (favouritesError || !favourites || favourites.length === 0) {
      return [];
   }

   const ids = favourites.map((row) => row.property_id as string);

   const { data, error } = await supabase
      .from("property_public")
      .select(PROPERTY_PUBLIC_COLUMNS)
      .in("id", ids);

   if (error || !data) {
      console.error("Failed to load favourite properties:", error?.message);
      return [];
   }

   const properties = await attachMedia(supabase, data as PropertyPublicRow[]);

   // property_public has no guaranteed order matching `ids` after `.in()`,
   // so re-sort to the favourited order (newest-favourited first).
   const orderById = new Map(ids.map((id, index) => [id, index]));
   return properties.sort((a, b) => (orderById.get(a.id) ?? 0) - (orderById.get(b.id) ?? 0));
}

// ---------------------------------------------------------------------------
// Seller-side reads (Phase 2). These read the base `properties` table, not
// `property_public` — a seller needs to see their own draft/pending/etc
// rows, which the public view never includes (it's `where status =
// 'published'`). Authorized by "sellers can read own properties any
// status" (0002); requireRole(["seller"]) at the call site is the
// app-level check in front of that RLS policy.
// ---------------------------------------------------------------------------

export interface SellerPropertyRow {
   id: string;
   title: string;
   slug: string;
   property_type: string;
   listing_type: "sale" | "rent";
   price: number;
   city: string;
   locality: string;
   status: "draft" | "pending" | "published" | "rejected" | "sold" | "archived";
   created_at: string;
   updated_at: string;
}

/** The caller's own listings, newest-updated first, excluding archived ones. */
export async function getOwnActivePropertyListings(): Promise<SellerPropertyRow[]> {
   const supabase = await createClient();
   const {
      data: { user },
   } = await supabase.auth.getUser();

   if (!user) return [];

   const { data, error } = await supabase
      .from("properties")
      .select("id, title, slug, property_type, listing_type, price, city, locality, status, created_at, updated_at")
      .eq("owner_id", user.id)
      .neq("status", "archived")
      .order("updated_at", { ascending: false });

   if (error) {
      console.error("Failed to load seller properties:", error.message);
      return [];
   }

   return (data ?? []) as SellerPropertyRow[];
}

/** One of the caller's own properties by id, or null if it doesn't exist / isn't theirs. */
export async function getOwnPropertyById(id: string): Promise<SellerPropertyRow & { description: string | null; area: number | string | null; area_unit: string | null; bedrooms: number | null; bathrooms: number | null } | null> {
   const supabase = await createClient();
   const {
      data: { user },
   } = await supabase.auth.getUser();

   if (!user) return null;

   const { data, error } = await supabase
      .from("properties")
      .select("id, title, slug, property_type, listing_type, price, area, area_unit, bedrooms, bathrooms, description, city, locality, status, created_at, updated_at")
      .eq("id", id)
      .eq("owner_id", user.id)
      .maybeSingle();

   if (error || !data) return null;
   return data;
}

export interface OwnPropertyMediaRow {
   id: string;
   storage_path: string;
   media_type: "image" | "video" | "floorplan" | "document";
   sort_order: number;
   publicUrl: string;
}

/** Media rows for one of the caller's own properties, with public URLs resolved. */
export async function getOwnPropertyMedia(propertyId: string): Promise<OwnPropertyMediaRow[]> {
   const supabase = await createClient();

   const { data, error } = await supabase
      .from("property_media")
      .select("id, storage_path, media_type, sort_order")
      .eq("property_id", propertyId)
      .order("sort_order", { ascending: true });

   if (error || !data) return [];

   return data.map((row) => ({
      ...row,
      publicUrl: propertyMediaPublicUrl(supabase, row.storage_path),
   }));
}

// ---------------------------------------------------------------------------
// Phase 7 — public Individual Property search, filtering, sorting and
// pagination.
//
// INVARIANT: every query in this section carries `.is("project_id", null)`.
// A Project Unit must never be reachable through any Individual Property
// discovery route — listing, search, filter, locality, pagination, or
// similar/recommended. The filter is applied on every branch below rather
// than in a shared helper on purpose: it is easier to audit a predicate
// that is visible at each call site than one that could be dropped by an
// unrelated refactor of a helper.
//
// All of it reads `property_public`, which is `where status = 'published'`
// and has no exact_lat/exact_lng/exact_address columns at all, so neither
// unpublished rows nor protected coordinates can be reached from here
// regardless of what parameters arrive from the URL.
// ---------------------------------------------------------------------------

export type PropertySort = "newest" | "price_asc" | "price_desc" | "area_desc";

export const PROPERTY_SORTS: PropertySort[] = ["newest", "price_asc", "price_desc", "area_desc"];

export const PROPERTY_PAGE_SIZE = 9;

export interface PropertySearchParams {
   /** Free-text keyword, matched against title/description/city/locality. */
   q?: string;
   propertyType?: string;
   listingType?: string;
   city?: string;
   locality?: string;
   minPrice?: number;
   maxPrice?: number;
   minArea?: number;
   maxArea?: number;
   sort?: PropertySort;
   page?: number;
   pageSize?: number;
}

export interface PropertySearchResult {
   items: Property[];
   total: number;
   page: number;
   pageSize: number;
   totalPages: number;
}

/**
 * PostgREST's `or=` filter is a comma-separated expression list, so a raw
 * keyword containing , ( ) or * would change the shape of the filter
 * rather than just its value. Those characters are stripped, and % / _
 * (the LIKE wildcards) with them, so a keyword can only ever widen to the
 * substring match this function intends — never to an arbitrary filter.
 */
const sanitizeKeyword = (value: string) => value.replace(/[,()*%_\\]/g, " ").trim().slice(0, 100);

const positiveNumberOrUndefined = (value: number | undefined) =>
   typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : undefined;

/** Published Individual Properties matching the given filters, paginated. */
export async function searchPublishedProperties(params: PropertySearchParams = {}): Promise<PropertySearchResult> {
   const supabase = await createClient();

   const pageSize = params.pageSize && params.pageSize > 0 ? Math.min(params.pageSize, 60) : PROPERTY_PAGE_SIZE;
   const page = params.page && params.page > 0 ? Math.floor(params.page) : 1;

   let query = supabase
      .from("property_public")
      .select(PROPERTY_PUBLIC_COLUMNS, { count: "exact" })
      // The Phase 2 separation invariant — see the section comment above.
      .is("project_id", null);

   const keyword = params.q ? sanitizeKeyword(params.q) : "";
   if (keyword) {
      query = query.or(
         `title.ilike.%${keyword}%,description.ilike.%${keyword}%,city.ilike.%${keyword}%,locality.ilike.%${keyword}%`
      );
   }

   if (params.propertyType) query = query.ilike("property_type", params.propertyType);
   if (params.listingType === "sale" || params.listingType === "rent") {
      query = query.eq("listing_type", params.listingType);
   }
   if (params.city) query = query.ilike("city", params.city);
   if (params.locality) query = query.ilike("locality", params.locality);

   const minPrice = positiveNumberOrUndefined(params.minPrice);
   const maxPrice = positiveNumberOrUndefined(params.maxPrice);
   if (minPrice !== undefined) query = query.gte("price", minPrice);
   if (maxPrice !== undefined) query = query.lte("price", maxPrice);

   const minArea = positiveNumberOrUndefined(params.minArea);
   const maxArea = positiveNumberOrUndefined(params.maxArea);
   if (minArea !== undefined) query = query.gte("area", minArea);
   if (maxArea !== undefined) query = query.lte("area", maxArea);

   switch (params.sort) {
      case "price_asc":
         query = query.order("price", { ascending: true });
         break;
      case "price_desc":
         query = query.order("price", { ascending: false });
         break;
      case "area_desc":
         query = query.order("area", { ascending: false, nullsFirst: false });
         break;
      default:
         query = query.order("published_at", { ascending: false, nullsFirst: false });
   }
   // Deterministic tie-break so a row can't appear on two pages.
   query = query.order("id", { ascending: true });

   const from = (page - 1) * pageSize;
   const { data, error, count } = await query.range(from, from + pageSize - 1);

   if (error) {
      console.error("Failed to search properties:", error.message);
      return { items: [], total: 0, page, pageSize, totalPages: 0 };
   }

   const items = await attachMedia(supabase, (data ?? []) as PropertyPublicRow[]);
   const total = count ?? items.length;

   return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
   };
}

export interface PropertyFacets {
   propertyTypes: string[];
   listingTypes: string[];
   cities: string[];
   localities: string[];
   minPrice: number;
   maxPrice: number;
}

/**
 * The distinct values available to filter on, derived from the live
 * published Individual Property set — so the filter panel can never offer
 * an option that returns nothing, and never offers a value that only
 * exists on a Project Unit.
 *
 * Deliberately a single narrow read rather than four DISTINCT queries:
 * the columns are small, the row set is already limited to published
 * standalone listings, and this avoids adding an RPC for what is
 * presentation metadata.
 */
export async function getPropertyFacets(): Promise<PropertyFacets> {
   const supabase = await createClient();

   const { data, error } = await supabase
      .from("property_public")
      .select("property_type, listing_type, city, locality, price")
      .is("project_id", null)
      .limit(1000);

   if (error || !data) {
      if (error) console.error("Failed to load property facets:", error.message);
      return { propertyTypes: [], listingTypes: [], cities: [], localities: [], minPrice: 0, maxPrice: 0 };
   }

   const prices = data.map((row) => Number(row.price)).filter((n) => Number.isFinite(n));

   const distinct = (values: (string | null)[]) =>
      Array.from(new Set(values.filter((v): v is string => Boolean(v)))).sort((a, b) => a.localeCompare(b));

   // Plot/Land first — Property Planet is primarily a plot/land
   // marketplace, matching the existing ordering in PropertiesListing.
   const propertyTypes = distinct(data.map((row) => row.property_type as string | null)).sort((a, b) => {
      const rank = (type: string) => (/^(plot|land)/i.test(type) ? 0 : 1);
      return rank(a) - rank(b) || a.localeCompare(b);
   });

   return {
      propertyTypes,
      listingTypes: distinct(data.map((row) => row.listing_type as string | null)),
      cities: distinct(data.map((row) => row.city as string | null)),
      localities: distinct(data.map((row) => row.locality as string | null)),
      minPrice: prices.length > 0 ? Math.min(...prices) : 0,
      maxPrice: prices.length > 0 ? Math.max(...prices) : 0,
   };
}
