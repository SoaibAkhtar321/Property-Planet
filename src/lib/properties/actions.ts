"use server";

// src/lib/properties/actions.ts
//
// Phase 2: server actions backing the seller property-listing workflow.
// Mirrors src/lib/admin/projects/actions.ts's pattern — each action
// independently calls the app-level auth check (requireRole(["seller"])
// here, requireAdmin() there), writes through the RLS-respecting
// createClient() (never createServiceClient()), and treats RLS + the
// 0008 trigger as the real backstop, not this file.
//
// Identity: owner_id is ALWAYS taken from getAuthContext().userId, never
// from form data — see project brief section 10. The client cannot
// control owner_id, initial status, or any moderation field.
//
// Status: status is never accepted from form data either.
//   * createPropertyListing always inserts status = 'draft'.
//   * submitPropertyForReview / archivePropertyListing are the only two
//     status-changing actions available to a seller, matching the
//     draft -> pending / draft -> archived lifecycle in the brief. Any
//     other transition is rejected by the 0008 trigger even if this file
//     had a bug, so this is defense in depth, not the only guard.
//   * There is no seller "publish", "reject", "sold", or delete action —
//     those are admin-only / not implemented, by design.

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { friendlyError } from "@/lib/errors";
import { parsePriceUnitFields } from "@/lib/properties/priceUnit";

export interface ActionResult {
   success: boolean;
   error?: string;
}

const numberOrNull = (value: FormDataEntryValue | null) => {
   if (!value || String(value).trim() === "") return null;
   const n = Number(value);
   return Number.isFinite(n) ? n : null;
};

const textOrNull = (value: FormDataEntryValue | null) => {
   const s = value ? String(value).trim() : "";
   return s === "" ? null : s;
};

/**
 * Creates an empty placeholder listing owned by the current seller, so the
 * Add Property screen has a real property id to upload photos against
 * (storage_path is `{property_id}/...`) from the very first render —
 * instead of making the seller save the text fields first and only then
 * reach a separate screen with the photo uploader. The seller never sees
 * this row directly: updatePropertyListing() below fills in every real
 * field (and re-validates them) the moment they submit the single combined
 * form, so the placeholder values here are never what actually gets
 * reviewed or published.
 */
export async function initDraftProperty(): Promise<{ id: string } | { error: string }> {
   const ctx = await requireRole(["seller"]);
   const supabase = await createClient();

   const slug = `draft-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

   const { data, error } = await supabase
      .from("properties")
      .insert({
         owner_id: ctx.userId,
         title: "Untitled listing",
         slug,
         property_type: "plot",
         listing_type: "sale",
         price: 0,
         city: "",
         locality: "",
         // status intentionally omitted — column default is 'draft'.
      })
      .select("id")
      .single();

   if (error || !data) {
      return { error: friendlyError(error, "Could not start a new listing. Please try again.", "initDraftProperty") };
   }

   return { id: data.id };
}

/**
 * Updates the seller-editable fields on one of the caller's own listings.
 * Only permitted while the listing is still `draft` — once submitted
 * (`pending`) or beyond, edits go through admin, matching "seller listings
 * require admin moderation" in the brief. Enforced here AND by the fact
 * that RLS + 0008 only let the row's owner touch it at all; this
 * draft-only check is an app-level guard on top, not a security boundary.
 */
export async function updatePropertyListing(id: string, formData: FormData): Promise<ActionResult> {
   const ctx = await requireRole(["seller"]);
   const supabase = await createClient();

   const { data: existing, error: fetchError } = await supabase
      .from("properties")
      .select("id, owner_id, status")
      .eq("id", id)
      .maybeSingle();

   if (fetchError || !existing) {
      return { success: false, error: "Listing not found." };
   }
   if (existing.owner_id !== ctx.userId) {
      return { success: false, error: "Not your listing." };
   }
   if (existing.status !== "draft") {
      return { success: false, error: "Only draft listings can be edited. Contact admin for changes to a submitted listing." };
   }

   const title = String(formData.get("title") ?? "").trim();
   if (title.length < 3) {
      return { success: false, error: "Title must be at least 3 characters." };
   }

   const city = textOrNull(formData.get("city"));
   const locality = textOrNull(formData.get("locality"));

   // Exact address + coordinates are required from here on (see
   // PropertyLocation.tsx). Without a property_location row, a listing
   // has no approx_lat/approx_lng and its public detail page renders no
   // map at all — this used to be possible to skip, which is exactly how
   // listings ended up published with no map. Validated before any write
   // so a half-saved property never results from a partially-filled form.
   const exactAddress = textOrNull(formData.get("exact_address"));
   const exactLat = numberOrNull(formData.get("exact_lat"));
   const exactLng = numberOrNull(formData.get("exact_lng"));

   if (!exactAddress || exactLat === null || exactLng === null) {
      return { success: false, error: "Full address, latitude and longitude are all required." };
   }
   if (exactLat < -90 || exactLat > 90 || exactLng < -180 || exactLng > 180) {
      return { success: false, error: "Latitude must be between -90 and 90, longitude between -180 and 180." };
   }

   const priceUnitFields = parsePriceUnitFields(formData);
   if (!priceUnitFields.ok) {
      return { success: false, error: priceUnitFields.error };
   }

   const { error } = await supabase
      .from("properties")
      .update({
         title,
         property_type: textOrNull(formData.get("property_type")),
         // Phase 20: always 'sale'. The seller form no longer offers a
         // rent option and this ignores the posted field entirely, so a
         // crafted request cannot create unsupported rental inventory.
         listing_type: "sale",
         price: numberOrNull(formData.get("price")),
         price_unit: priceUnitFields.price_unit,
         price_unit_label: priceUnitFields.price_unit_label,
         area: numberOrNull(formData.get("area")),
         area_unit: textOrNull(formData.get("area_unit")) ?? "sqft",
         bedrooms: numberOrNull(formData.get("bedrooms")),
         bathrooms: numberOrNull(formData.get("bathrooms")),
         description: textOrNull(formData.get("description")),
         city,
         locality,
      })
      .eq("id", id);

   if (error) {
      return { success: false, error: friendlyError(error, "Could not save your changes. Please try again.", "properties") };
   }

   // Upsert property_location. approx_lat/approx_lng are only set here as
   // the NOT NULL placeholder on first insert — apply_location_jitter()
   // (0003) immediately overwrites them server-side with a randomized
   // 150-500m offset on both INSERT and UPDATE OF exact_lat/exact_lng, so
   // the real coordinate is never what ends up in the public column. RLS
   // ("owners can write/update own property location", 0002) is what
   // actually lets this succeed only for the property's own owner.
   const { data: existingLocation } = await supabase
      .from("property_location")
      .select("property_id")
      .eq("property_id", id)
      .maybeSingle();

   const locationPayload = {
      city,
      locality,
      area: textOrNull(formData.get("location_area")),
      nearby_landmarks: textOrNull(formData.get("nearby_landmarks")),
      exact_address: exactAddress,
      exact_lat: exactLat,
      exact_lng: exactLng,
   };

   const { error: locationError } = existingLocation
      ? await supabase.from("property_location").update(locationPayload).eq("property_id", id)
      : await supabase.from("property_location").insert({
           property_id: id,
           ...locationPayload,
           approx_lat: exactLat,
           approx_lng: exactLng,
        });

   if (locationError) {
      return { success: false, error: friendlyError(locationError, "Could not save the location. Please try again.", "properties.location") };
   }

   revalidatePath("/dashboard/properties-list");
   return { success: true };
}

/**
 * draft -> pending. The seller's only path to getting a listing in front
 * of admin for moderation. Allowed by the 0008 trigger; any other status
 * value passed here is rejected at the database level regardless of what
 * this function does.
 */
export async function submitPropertyForReview(id: string): Promise<ActionResult> {
   const ctx = await requireRole(["seller"]);
   const supabase = await createClient();

   const { error } = await supabase
      .from("properties")
      .update({ status: "pending" })
      .eq("id", id)
      .eq("owner_id", ctx.userId)
      .eq("status", "draft");

   if (error) {
      return { success: false, error: friendlyError(error, "Could not save your changes. Please try again.", "properties") };
   }

   revalidatePath("/dashboard/properties-list");
   return { success: true };
}

/**
 * draft -> archived. The seller's removal mechanism — see project brief
 * section 9: no physical delete, so the row, its media relationships, and
 * ownership history are preserved. Archived listings drop out of the
 * seller's active list and were never in property_public to begin with.
 */
export async function archivePropertyListing(id: string): Promise<ActionResult> {
   const ctx = await requireRole(["seller"]);
   const supabase = await createClient();

   const { error } = await supabase
      .from("properties")
      .update({ status: "archived" })
      .eq("id", id)
      .eq("owner_id", ctx.userId)
      .eq("status", "draft");

   if (error) {
      return { success: false, error: friendlyError(error, "Could not save your changes. Please try again.", "properties") };
   }

   revalidatePath("/dashboard/properties-list");
   return { success: true };
}
