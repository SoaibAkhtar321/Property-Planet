import { createClient } from "@/lib/supabase/server";
import { Property } from "@/components/properties/data/types";
import { mapProperty, propertyMediaPublicUrl, PropertyMediaRow, PropertyPublicRow } from "./mapProperty";

const PROPERTY_PUBLIC_COLUMNS =
   "id, title, slug, property_type, listing_type, price, area, area_unit, bedrooms, bathrooms, description, city, locality, published_at, location_area, nearby_landmarks, approx_lat, approx_lng";

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

/** All published properties, newest first. Used by /properties. */
export async function getPublishedProperties(): Promise<Property[]> {
   const supabase = await createClient();

   const { data, error } = await supabase
      .from("property_public")
      .select(PROPERTY_PUBLIC_COLUMNS)
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
   return mapped;
}

/** Up to `limit` other published properties of the same property_type. */
export async function getSimilarProperties(property: Property, limit = 2): Promise<Property[]> {
   const supabase = await createClient();

   const { data, error } = await supabase
      .from("property_public")
      .select(PROPERTY_PUBLIC_COLUMNS)
      .eq("property_type", property.propertyType.toLowerCase())
      .neq("slug", property.slug)
      .order("published_at", { ascending: false })
      .limit(limit);

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
