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
