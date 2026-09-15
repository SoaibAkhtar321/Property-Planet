"use server";

// src/lib/admin/properties/actions.ts
//
// Server actions backing the /admin/properties moderation queue. Mirrors
// src/lib/admin/projects/actions.ts's pattern — requireAdmin() first
// (defense-in-depth alongside src/middleware.ts), write through the
// RLS-respecting createClient(), never createServiceClient().
//
// Authorization for the actual write is enforced by "admins can update any
// property" (0002_properties_and_location.sql) — enforce_seller_property_
// update() (0008) exempts admin callers entirely, so these transitions
// (pending -> published, pending -> rejected) are not subject to the
// draft-only seller transition rules. requireAdmin() is the app-level
// check in front of that database-level backstop, not a replacement.
//
// Only `pending` listings are approved/rejected from here, matching the
// moderation queue's scope (see queries.ts) — the mutations themselves
// don't hard-require the existing status to be `pending` beyond what the
// UI already filters to, since an admin correcting a previously-rejected
// listing back to published (or vice versa) is a legitimate admin action,
// not a bug.
//
// createAdminPropertyListing (Phase 1) follows the same pattern plus one
// more backstop: 0016_admin_properties_insert.sql adds the admin INSERT
// policy this write actually needs (none existed before — only sellers
// could insert). owner_id is always ctx.userId from requireAdmin()'s
// session, never client-supplied, matching createPropertyListing()'s rule
// in src/lib/properties/actions.ts for the seller path. Unlike the seller
// path, an admin-created listing may go straight to `published` (brief:
// "Admin-created listings can be published directly") — when it does,
// published_at is set here explicitly because properties_set_published_at
// (0002) is a BEFORE UPDATE trigger and never fires on INSERT.

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import { createClient } from "@/lib/supabase/server";

export interface ActionResult {
   success: boolean;
   error?: string;
}

function revalidatePropertyPaths(id: string) {
   revalidatePath("/admin/properties");
   revalidatePath(`/admin/properties/${id}`);
   revalidatePath("/admin");
   revalidatePath("/properties");
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

const slugify = (value: string) =>
   value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

/**
 * Creates a property listing as admin. Reuses the exact same form fields
 * as the seller's createPropertyListing() (src/lib/properties/actions.ts)
 * — same columns, same validation, same slugify convention — the only
 * differences are the auth guard (requireAdmin vs requireRole(["seller"]))
 * and that the admin may publish immediately instead of always landing in
 * `draft`.
 */
export async function createAdminPropertyListing(formData: FormData): Promise<void> {
   const session = await requireAdmin();
   const supabase = await createClient();

   const title = String(formData.get("title") ?? "").trim();
   if (title.length < 3) {
      redirect("/admin/properties/new?error=" + encodeURIComponent("Title must be at least 3 characters."));
   }

   const price = numberOrNull(formData.get("price"));
   if (price === null || price < 0) {
      redirect("/admin/properties/new?error=" + encodeURIComponent("A valid price is required."));
   }

   const city = textOrNull(formData.get("city"));
   const locality = textOrNull(formData.get("locality"));
   if (!city || !locality) {
      redirect("/admin/properties/new?error=" + encodeURIComponent("City and locality are required."));
   }

   const propertyType = textOrNull(formData.get("property_type"));
   if (!propertyType) {
      redirect("/admin/properties/new?error=" + encodeURIComponent("Property type is required."));
   }

   const publishNow = formData.get("publish_now") === "on";

   const slugSeed = `${title}-${city}`;
   const slug = `${slugify(slugSeed)}-${Date.now().toString(36)}`;

   const { data, error } = await supabase
      .from("properties")
      .insert({
         owner_id: session.userId,
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
         status: publishNow ? "published" : "draft",
         // Trigger-set on UPDATE only (0002) — set it directly here since
         // this is an INSERT going straight to `published`.
         published_at: publishNow ? new Date().toISOString() : null,
      })
      .select("id")
      .single();

   if (error || !data) {
      redirect("/admin/properties/new?error=" + encodeURIComponent(error?.message ?? "Failed to create listing."));
   }

   revalidatePropertyPaths(data.id);
   redirect(`/admin/properties/${data.id}`);
}

/** Approves a property: status -> published. */
export async function approveProperty(id: string): Promise<ActionResult> {
   await requireAdmin();
   const supabase = await createClient();

   const { error } = await supabase
      .from("properties")
      .update({ status: "published", rejection_reason: null })
      .eq("id", id);

   if (error) {
      return { success: false, error: error.message };
   }

   revalidatePropertyPaths(id);
   return { success: true };
}

/** Rejects a property: status -> rejected, with an optional reason recorded for the seller. */
export async function rejectProperty(id: string, reason?: string): Promise<ActionResult> {
   await requireAdmin();
   const supabase = await createClient();

   const trimmedReason = reason?.trim();

   const { error } = await supabase
      .from("properties")
      .update({ status: "rejected", rejection_reason: trimmedReason ? trimmedReason : null })
      .eq("id", id);

   if (error) {
      return { success: false, error: error.message };
   }

   revalidatePropertyPaths(id);
   return { success: true };
}
