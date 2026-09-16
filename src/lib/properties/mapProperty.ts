import { Property, PropertyOverviewItem } from "@/components/properties/data/types";

// Row shapes matching what we actually select from Supabase.
// (property_public is the RLS-safe public view from 0002_properties_and_location.sql —
// it never exposes exact_lat/exact_lng/exact_address.)

export interface PropertyPublicRow {
   id: string;
   title: string;
   slug: string;
   property_type: string;
   listing_type: "sale" | "rent";
   is_featured?: boolean | null;
   price: number | string;
   area: number | string | null;
   area_unit: string | null;
   bedrooms: number | null;
   bathrooms: number | null;
   description: string | null;
   city: string;
   locality: string;
   published_at: string | null;
   location_area: string | null;
   nearby_landmarks: string | null;
   // Nullable since 0019: property_public LEFT JOINs property_location so
   // a published property with no location row yet is still visible.
   approx_lat: number | null;
   approx_lng: number | null;
   /** Parent project (0007). NULL => Individual Property; set => Project Unit. */
   project_id: string | null;
}

export interface PropertyMediaRow {
   id: string;
   property_id: string;
   storage_path: string;
   media_type: "image" | "video" | "floorplan" | "document";
   sort_order: number;
}

const titleCase = (value: string) =>
   value
      .split(/[\s_-]+/)
      .filter(Boolean)
      .map((word) => word[0].toUpperCase() + word.slice(1))
      .join(" ");

export const propertyMediaPublicUrl = (
   supabase: { storage: { from: (bucket: string) => { getPublicUrl: (path: string) => { data: { publicUrl: string } } } } },
   storagePath: string
) => supabase.storage.from("property-media").getPublicUrl(storagePath).data.publicUrl;

/**
 * Maps a `property_public` row plus its `property_media` rows onto the
 * canonical Property shape used by the /properties pages.
 *
 * Deliberately left undefined (rather than invented) because the schema has
 * no columns for them yet: amenities. Their detail-page sections already
 * render nothing when the field is absent.
 */
export function mapProperty(
   row: PropertyPublicRow,
   media: { publicUrl: string; media_type: PropertyMediaRow["media_type"]; sort_order: number }[]
): Property {
   const images = media
      .filter((m) => m.media_type === "image")
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((m) => m.publicUrl);

   const floorPlanImages = media
      .filter((m) => m.media_type === "floorplan")
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((m) => m.publicUrl);

   const videoUrl = media.find((m) => m.media_type === "video")?.publicUrl;

   const overviewItems: PropertyOverviewItem[] = [];
   if (row.area) overviewItems.push({ label: "Area", value: `${row.area} ${row.area_unit ?? "sqft"}` });
   if (typeof row.bedrooms === "number") overviewItems.push({ label: "Bed", value: String(row.bedrooms) });
   if (typeof row.bathrooms === "number") overviewItems.push({ label: "Bath", value: String(row.bathrooms) });
   overviewItems.push({ label: "Type", value: titleCase(row.property_type) });

   const overviewParts = [row.description, row.location_area, row.nearby_landmarks].filter(Boolean);

   return {
      id: row.id,
      slug: row.slug,
      title: row.title,
      tag: titleCase(row.property_type),
      // Phase 20: public surfaces are sale-only (see SALE_ONLY in
      // queries.ts), so this is always "Sale". The field is kept on the
      // Property type because the detail page's overview table and the
      // admin/seller views still describe the listing, but no public card
      // advertises a rent/sale choice any more.
      listingType: "Sale",
      featured: Boolean(row.is_featured),
      propertyType: titleCase(row.property_type),
      // Public-safe address only — exact_address is never exposed here,
      // preserving the location-privacy split from 0002_properties_and_location.sql.
      address: `${row.locality}, ${row.city}`,
      locality: row.locality,
      price: Number(row.price),
      // No per-month price unit: a monthly figure only ever applied to
      // rental inventory, which is no longer publicly exposed.
      priceUnit: undefined,
      sqft: row.area ? Number(row.area) : undefined,
      bed: row.bedrooms ?? undefined,
      bath: row.bathrooms ?? undefined,
      images,
      projectId: row.project_id ?? undefined,
      overview: overviewParts.length > 0 ? overviewParts.join(" ") : undefined,
      overviewItems: overviewItems.length > 0 ? overviewItems : undefined,
      // No amenities column exists yet — left undefined rather than invented;
      // Amenities.tsx already renders nothing when this is absent.
      amenities: undefined,
      // No structured nearby-distance list exists yet (only the free-text
      // nearby_landmarks column, folded into `overview` above), so the
      // structured NearbyList section is left unpopulated rather than
      // fabricating distances.
      nearby: undefined,
      floorPlanImages: floorPlanImages.length > 0 ? floorPlanImages : undefined,
      videoUrl,
      // No property_location row yet (0019) => no map to embed, rather than
      // a broken q=null,null URL.
      mapEmbedUrl:
         row.approx_lat != null && row.approx_lng != null
            ? `https://maps.google.com/maps?q=${row.approx_lat},${row.approx_lng}&z=15&output=embed`
            : undefined,
   };
}