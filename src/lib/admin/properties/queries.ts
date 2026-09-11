// src/lib/admin/properties/queries.ts
//
// Admin-only property reads for the /admin/properties moderation queue.
// Reads the base `properties` table directly (not `property_public`, which
// is published-only) — safe because every call site is behind
// requireAdmin(), reads go through createClient() (RLS-respecting), and
// "admins can read all properties" / "admins can read all property
// locations" (0002_properties_and_location.sql) authorize the wider read,
// including exact_lat/exact_lng/exact_address on property_location, which
// no public component or public API in this file ever exposes further.

import { createClient } from "@/lib/supabase/server";
import { propertyMediaPublicUrl } from "@/lib/properties/mapProperty";

export type PropertyStatus = "draft" | "pending" | "published" | "rejected" | "sold" | "archived";

export interface AdminPropertyListRow {
   id: string;
   title: string;
   slug: string;
   property_type: string;
   listing_type: string;
   price: number;
   status: PropertyStatus;
   city: string;
   locality: string;
   owner_id: string;
   owner_name: string | null;
   created_at: string;
   updated_at: string;
}

/** Properties in the given statuses (default: pending), for the moderation queue. Newest first. */
export async function getPropertiesForModeration(
   statuses: PropertyStatus[] = ["pending"]
): Promise<AdminPropertyListRow[]> {
   const supabase = await createClient();

   const { data, error } = await supabase
      .from("properties")
      .select("id, title, slug, property_type, listing_type, price, status, city, locality, owner_id, created_at, updated_at")
      .in("status", statuses)
      .order("created_at", { ascending: false });

   if (error) {
      console.error("Failed to load properties for moderation:", error.message);
      return [];
   }
   if (!data || data.length === 0) return [];

   const ownerIds = Array.from(new Set(data.map((p) => p.owner_id)));
   const { data: owners, error: ownerError } = await supabase.from("profiles").select("id, full_name").in("id", ownerIds);

   if (ownerError) console.error("Failed to load property owners:", ownerError.message);

   const ownerById = new Map((owners ?? []).map((o) => [o.id, o]));

   return data.map((p) => ({
      ...(p as Omit<AdminPropertyListRow, "owner_name">),
      owner_name: ownerById.get(p.owner_id)?.full_name ?? null,
   }));
}

export interface AdminPropertyDetail {
   id: string;
   title: string;
   slug: string;
   property_type: string;
   listing_type: string;
   price: number;
   area: number | null;
   area_unit: string | null;
   bedrooms: number | null;
   bathrooms: number | null;
   description: string | null;
   status: PropertyStatus;
   city: string;
   locality: string;
   rejection_reason: string | null;
   created_at: string;
   updated_at: string;
   owner_id: string;
   owner_name: string | null;
   owner_phone: string | null;
   location: {
      approx_lat: number;
      approx_lng: number;
      exact_lat: number;
      exact_lng: number;
      exact_address: string;
      nearby_landmarks: string | null;
   } | null;
   media: { id: string; storage_path: string; media_type: string; sort_order: number; publicUrl: string }[];
}

/** A single property (any status) with seller, location, and media — for the moderation review screen. Null if not found. */
export async function getPropertyForModeration(id: string): Promise<AdminPropertyDetail | null> {
   const supabase = await createClient();

   const { data: property, error } = await supabase
      .from("properties")
      .select(
         "id, title, slug, property_type, listing_type, price, area, area_unit, bedrooms, bathrooms, description, status, city, locality, rejection_reason, created_at, updated_at, owner_id"
      )
      .eq("id", id)
      .maybeSingle();

   if (error) {
      console.error("Failed to load property for moderation:", error.message);
      return null;
   }
   if (!property) return null;

   const [{ data: owner }, { data: location, error: locError }, { data: media, error: mediaError }] = await Promise.all([
      supabase.from("profiles").select("id, full_name, phone").eq("id", property.owner_id).maybeSingle(),
      supabase
         .from("property_location")
         .select("approx_lat, approx_lng, exact_lat, exact_lng, exact_address, nearby_landmarks")
         .eq("property_id", id)
         .maybeSingle(),
      supabase.from("property_media").select("id, storage_path, media_type, sort_order").eq("property_id", id).order("sort_order"),
   ]);

   if (locError) console.error("Failed to load property_location for moderation:", locError.message);
   if (mediaError) console.error("Failed to load property_media for moderation:", mediaError.message);

   const mediaRows = (media ?? []).map((m) => ({
      ...m,
      publicUrl: propertyMediaPublicUrl(supabase, m.storage_path),
   }));

   return {
      ...(property as Omit<AdminPropertyDetail, "owner_name" | "owner_phone" | "location" | "media">),
      owner_name: owner?.full_name ?? null,
      owner_phone: owner?.phone ?? null,
      location: location ?? null,
      media: mediaRows,
   };
}
