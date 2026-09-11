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
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export interface ActionResult {
   success: boolean;
   error?: string;
}

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

/**
 * Creates a new listing owned by the current seller, always in `draft`.
 * Redirects into the properties list on success, or back to the form with
 * an error on failure — same convention as createProject().
 */
export async function createPropertyListing(formData: FormData): Promise<void> {
   const ctx = await requireRole(["seller"]);
   const supabase = await createClient();

   const title = String(formData.get("title") ?? "").trim();
   if (title.length < 3) {
      redirect("/dashboard/add-property?error=" + encodeURIComponent("Title must be at least 3 characters."));
   }

   const price = numberOrNull(formData.get("price"));
   if (price === null || price < 0) {
      redirect("/dashboard/add-property?error=" + encodeURIComponent("A valid price is required."));
   }

   const city = textOrNull(formData.get("city"));
   const locality = textOrNull(formData.get("locality"));
   if (!city || !locality) {
      redirect("/dashboard/add-property?error=" + encodeURIComponent("City and locality are required."));
   }

   const propertyType = textOrNull(formData.get("property_type"));
   if (!propertyType) {
      redirect("/dashboard/add-property?error=" + encodeURIComponent("Property type is required."));
   }

   const slugSeed = `${title}-${city}`;
   const slug = `${slugify(slugSeed)}-${Date.now().toString(36)}`;

   const { data, error } = await supabase
      .from("properties")
      .insert({
         owner_id: ctx.userId,
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
         // status intentionally omitted — column default is 'draft'.
      })
      .select("id")
      .single();

   if (error || !data) {
      redirect("/dashboard/add-property?error=" + encodeURIComponent(error?.message ?? "Failed to create listing."));
   }

   revalidatePath("/dashboard/properties-list");
   redirect("/dashboard/properties-list");
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

   const { error } = await supabase
      .from("properties")
      .update({
         title,
         property_type: textOrNull(formData.get("property_type")),
         listing_type: textOrNull(formData.get("listing_type")) ?? "sale",
         price: numberOrNull(formData.get("price")),
         area: numberOrNull(formData.get("area")),
         area_unit: textOrNull(formData.get("area_unit")) ?? "sqft",
         bedrooms: numberOrNull(formData.get("bedrooms")),
         bathrooms: numberOrNull(formData.get("bathrooms")),
         description: textOrNull(formData.get("description")),
         city: textOrNull(formData.get("city")),
         locality: textOrNull(formData.get("locality")),
      })
      .eq("id", id);

   if (error) {
      return { success: false, error: error.message };
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
      return { success: false, error: error.message };
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
      return { success: false, error: error.message };
   }

   revalidatePath("/dashboard/properties-list");
   return { success: true };
}
