// src/lib/admin/units/queries.ts
//
// Admin-only reads for the units/plots belonging to a Project.
//
// A "unit" is not a separate entity: it is a `properties` row whose
// project_id points at the project (0007_properties_project_id.sql). These
// queries therefore read `properties` directly — same as
// src/lib/admin/properties/queries.ts, and safe for the same reasons:
// every call site is behind requireAdmin(), reads go through the
// RLS-respecting createClient(), and "admins can read all properties"
// (0002) authorizes seeing every status, not just published.
//
// Nothing here touches property_location, so no exact-location data enters
// the unit-management screens at all.

import { createClient } from "@/lib/supabase/server";

export type PropertyStatus = "draft" | "pending" | "published" | "rejected" | "sold" | "archived";

export interface AdminUnitRow {
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
   owner_id: string;
   created_at: string;
}

/** Every unit/plot attached to the given project, oldest first (stable listing order). */
export async function getProjectUnits(projectId: string): Promise<AdminUnitRow[]> {
   const supabase = await createClient();

   const { data, error } = await supabase
      .from("properties")
      .select(
         "id, title, slug, property_type, listing_type, price, area, area_unit, bedrooms, bathrooms, description, status, city, locality, owner_id, created_at"
      )
      .eq("project_id", projectId)
      .order("created_at", { ascending: true });

   if (error) {
      console.error("Failed to load project units:", error.message);
      return [];
   }

   return (data ?? []) as AdminUnitRow[];
}

export interface AttachableUnitRow {
   id: string;
   title: string;
   city: string;
   locality: string;
   status: PropertyStatus;
}

/**
 * Properties that are currently standalone (project_id is null) and could
 * therefore be attached to a project. Deliberately limited and unsorted by
 * owner — this is a lookup aid for the admin attach form, and the attach
 * action re-derives the "still unattached" condition itself rather than
 * trusting anything this list produced.
 */
export async function getAttachableProperties(limit = 50): Promise<AttachableUnitRow[]> {
   const supabase = await createClient();

   const { data, error } = await supabase
      .from("properties")
      .select("id, title, city, locality, status")
      .is("project_id", null)
      .in("status", ["draft", "pending", "published"])
      .order("created_at", { ascending: false })
      .limit(limit);

   if (error) {
      console.error("Failed to load attachable properties:", error.message);
      return [];
   }

   return (data ?? []) as AttachableUnitRow[];
}
