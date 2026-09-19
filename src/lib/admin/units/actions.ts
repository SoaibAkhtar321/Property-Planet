"use server";

// src/lib/admin/units/actions.ts
//
// Server actions for managing the units/plots of a Project.
//
// A unit is a `properties` row with project_id set (0007) — there is no
// units table and no duplicated property data. These actions therefore
// reuse the exact same columns and the same helpers as the existing
// property actions (src/lib/properties/actions.ts,
// src/lib/admin/properties/actions.ts); the only thing that makes them
// "unit" actions is that they always scope the write to
// project_id = <the project being edited>.
//
// Authorization, in order:
//   1. requireAdmin() at the top of every action — server actions are
//      directly callable endpoints that src/middleware.ts does not cover
//      (see src/lib/admin/auth.ts).
//   2. RLS: "admins can insert any property" (0016) / "admins can update
//      any property" (0002) are what actually permit the write.
//   3. 0017_project_units.sql: non-admin callers cannot set or change
//      properties.project_id at all, on INSERT or UPDATE, so no seller can
//      self-attach a listing to a project even by calling the database
//      directly.
//
// Never trusted from the client: owner_id (always the admin's own session
// userId on create, never read from form data, never changed on update),
// project_id (always the bound projectId argument, never a form field),
// and slug (always derived server-side).
//
// Detach sets project_id = null — an UPDATE, not a DELETE. The property
// row, its owner, its media, and its lead history all survive, matching
// the "no physical delete" convention in 0002/0006.

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";
import { createClient } from "@/lib/supabase/server";
import { friendlyError } from "@/lib/errors";

export interface ActionResult {
   success: boolean;
   error?: string;
}

/** Statuses an admin may set on a unit from the project screen. */
export type UnitStatus = "draft" | "published" | "sold" | "archived";

const UNIT_STATUSES: UnitStatus[] = ["draft", "published", "sold", "archived"];

const slugify = (value: string) =>
   value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

const numberOrNull = (value: FormDataEntryValue | null) => {
   if (!value || String(value).trim() === "") return null;
   const n = Number(value);
   return Number.isFinite(n) ? n : null;
};

const textOrNull = (value: FormDataEntryValue | null) => {
   const s = value ? String(value).trim() : "";
   return s === "" ? null : s;
};

function revalidateUnitPaths(projectId: string) {
   revalidatePath(`/admin/projects/${projectId}`);
   revalidatePath("/admin/properties");
   revalidatePath("/projects");
   revalidatePath("/properties");
}

/**
 * Re-reads a unit and confirms it really belongs to the project the caller
 * is editing. Every mutation below goes through this first, so a
 * guessed/forged unit id from another project (or an unattached property)
 * cannot be edited through this project's screen.
 */
async function loadUnitInProject(
   supabase: Awaited<ReturnType<typeof createClient>>,
   projectId: string,
   unitId: string
): Promise<{ id: string; slug: string } | null> {
   const { data, error } = await supabase
      .from("properties")
      .select("id, slug, project_id")
      .eq("id", unitId)
      .maybeSingle();

   if (error || !data || data.project_id !== projectId) return null;
   return { id: data.id, slug: data.slug };
}

/**
 * Creates a new unit/plot inside a project.
 *
 * owner_id is the admin's own session id, exactly as
 * createAdminPropertyListing() does for a standalone admin listing —
 * the unit is admin-managed inventory, not a seller submission.
 *
 * If a full exact location (address + lat + lng) is supplied, the matching
 * property_location row is created too. That row is required for the unit
 * to appear in `property_public`, which is what its public detail page
 * (/properties/[slug]) reads — so a unit created without it stays visible
 * and editable in admin but has no public page yet. approx_lat/approx_lng
 * are NOT written here: apply_location_jitter() (0003) derives them
 * server-side, and this action never bypasses it.
 */
export async function createProjectUnit(projectId: string, formData: FormData): Promise<ActionResult> {
   const session = await requireAdmin();
   const supabase = await createClient();

   const title = String(formData.get("title") ?? "").trim();
   if (title.length < 3) {
      return { success: false, error: "Unit name/number must be at least 3 characters." };
   }

   const price = numberOrNull(formData.get("price"));
   if (price === null || price < 0) {
      return { success: false, error: "A valid price is required." };
   }

   const propertyType = textOrNull(formData.get("property_type"));
   if (!propertyType) {
      return { success: false, error: "Unit type is required." };
   }

   const city = textOrNull(formData.get("city"));
   const locality = textOrNull(formData.get("locality"));
   if (!city || !locality) {
      return { success: false, error: "City and locality are required." };
   }

   const requestedStatus = String(formData.get("status") ?? "draft") as UnitStatus;
   const status: UnitStatus = UNIT_STATUSES.includes(requestedStatus) ? requestedStatus : "draft";

   const slug = `${slugify(`${title}-${city}`)}-${Date.now().toString(36)}`;

   const { data, error } = await supabase
      .from("properties")
      .insert({
         // Never from the client: identity and project linkage.
         owner_id: session.userId,
         project_id: projectId,
         title,
         slug,
         property_type: propertyType,
         listing_type: textOrNull(formData.get("listing_type")) ?? "sale",
         price,
         area: numberOrNull(formData.get("area")),
         area_unit: textOrNull(formData.get("area_unit")) ?? "sqft",
         bedrooms: numberOrNull(formData.get("bedrooms")),
         bathrooms: numberOrNull(formData.get("bathrooms")),
         description: textOrNull(formData.get("description")),
         city,
         locality,
         status,
         // properties_set_published_at (0002) is BEFORE UPDATE only, so an
         // insert that goes straight to `published` has to set this here —
         // same as createAdminPropertyListing().
         published_at: status === "published" ? new Date().toISOString() : null,
      })
      .select("id")
      .single();

   if (error || !data) {
      return { success: false, error: friendlyError(error, "Could not create the unit. Please try again.", "admin.units.createProjectUnit") };
   }

   const exactAddress = textOrNull(formData.get("exact_address"));
   const exactLat = numberOrNull(formData.get("exact_lat"));
   const exactLng = numberOrNull(formData.get("exact_lng"));

   if (exactAddress && exactLat !== null && exactLng !== null) {
      const { error: locationError } = await supabase.from("property_location").insert({
         property_id: data.id,
         city,
         locality,
         exact_address: exactAddress,
         exact_lat: exactLat,
         exact_lng: exactLng,
         // approx_lat/approx_lng are NOT NULL but are overwritten by
         // apply_location_jitter() (0003) before the row lands; seeding
         // them with the exact values here would still be replaced by the
         // trigger's randomized 150-500m offset.
         approx_lat: exactLat,
         approx_lng: exactLng,
      });

      if (locationError) {
         revalidateUnitPaths(projectId);
         return { success: false, error: friendlyError(locationError, "The unit was created, but its location could not be saved. Please try saving the location again.", "admin.units.createProjectUnit") };
      }
   }

   revalidateUnitPaths(projectId);
   return { success: true };
}

/** Updates the editable fields of a unit that belongs to this project. */
export async function updateProjectUnit(projectId: string, unitId: string, formData: FormData): Promise<ActionResult> {
   await requireAdmin();
   const supabase = await createClient();

   const unit = await loadUnitInProject(supabase, projectId, unitId);
   if (!unit) return { success: false, error: "That unit does not belong to this project." };

   const title = String(formData.get("title") ?? "").trim();
   if (title.length < 3) {
      return { success: false, error: "Unit name/number must be at least 3 characters." };
   }

   const price = numberOrNull(formData.get("price"));
   if (price === null || price < 0) {
      return { success: false, error: "A valid price is required." };
   }

   const { error } = await supabase
      .from("properties")
      .update({
         title,
         property_type: textOrNull(formData.get("property_type")),
         listing_type: textOrNull(formData.get("listing_type")) ?? "sale",
         price,
         area: numberOrNull(formData.get("area")),
         area_unit: textOrNull(formData.get("area_unit")) ?? "sqft",
         bedrooms: numberOrNull(formData.get("bedrooms")),
         bathrooms: numberOrNull(formData.get("bathrooms")),
         description: textOrNull(formData.get("description")),
         city: textOrNull(formData.get("city")),
         locality: textOrNull(formData.get("locality")),
         // owner_id, project_id, slug, status and published_at are
         // deliberately absent — status has its own action below, and the
         // rest are never editable from this form.
      })
      .eq("id", unitId)
      .eq("project_id", projectId);

   if (error) return { success: false, error: friendlyError(error, "Could not update the unit. Please try again.", "admin.units.updateProjectUnit") };

   revalidateUnitPaths(projectId);
   return { success: true };
}

/**
 * Changes a unit's availability/status. Uses the existing property_status
 * enum — `published` is an available, publicly listed unit, `sold` takes
 * it out of public view, `draft`/`archived` are the pre/post-listing
 * states. No new availability column is introduced.
 */
export async function setProjectUnitStatus(projectId: string, unitId: string, status: UnitStatus): Promise<ActionResult> {
   await requireAdmin();

   if (!UNIT_STATUSES.includes(status)) {
      return { success: false, error: "Unsupported unit status." };
   }

   const supabase = await createClient();

   const unit = await loadUnitInProject(supabase, projectId, unitId);
   if (!unit) return { success: false, error: "That unit does not belong to this project." };

   const { error } = await supabase
      .from("properties")
      .update({ status })
      .eq("id", unitId)
      .eq("project_id", projectId);

   if (error) return { success: false, error: friendlyError(error, "Could not update the unit status. Please try again.", "admin.units.setProjectUnitStatus") };

   revalidateUnitPaths(projectId);
   return { success: true };
}

/**
 * Attaches an existing standalone property to this project.
 *
 * Only a property that is currently unattached (project_id is null) may be
 * attached, and that condition is re-derived here AND re-asserted in the
 * UPDATE's own `.is("project_id", null)` filter — so this can never steal
 * a unit out of another project. Ownership is untouched: the seller who
 * owns the listing still owns it; only its curation/placement changes.
 */
export async function attachPropertyToProject(projectId: string, formData: FormData): Promise<ActionResult> {
   await requireAdmin();
   const supabase = await createClient();

   const propertyId = textOrNull(formData.get("property_id"));
   if (!propertyId) return { success: false, error: "Choose a property to attach." };

   const { data: existing, error: fetchError } = await supabase
      .from("properties")
      .select("id, project_id")
      .eq("id", propertyId)
      .maybeSingle();

   if (fetchError || !existing) return { success: false, error: "That property could not be found." };
   if (existing.project_id) return { success: false, error: "That property is already part of a project." };

   const { error } = await supabase
      .from("properties")
      .update({ project_id: projectId })
      .eq("id", propertyId)
      .is("project_id", null);

   if (error) return { success: false, error: friendlyError(error, "Could not attach the property to the project. Please try again.", "admin.units.attachPropertyToProject") };

   revalidateUnitPaths(projectId);
   return { success: true };
}

/**
 * Detaches a unit from this project: project_id -> null. The row becomes a
 * standalone Individual Property again (and, if published, reappears in
 * /properties). Nothing is deleted and owner_id is not touched.
 */
export async function detachUnitFromProject(projectId: string, unitId: string): Promise<ActionResult> {
   await requireAdmin();
   const supabase = await createClient();

   const unit = await loadUnitInProject(supabase, projectId, unitId);
   if (!unit) return { success: false, error: "That unit does not belong to this project." };

   const { error } = await supabase
      .from("properties")
      .update({ project_id: null })
      .eq("id", unitId)
      .eq("project_id", projectId);

   if (error) return { success: false, error: friendlyError(error, "Could not detach the unit from the project. Please try again.", "admin.units.detachUnitFromProject") };

   revalidateUnitPaths(projectId);
   return { success: true };
}
