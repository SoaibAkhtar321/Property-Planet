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

/**
 * Creates an empty placeholder listing as admin, mirroring
 * initDraftProperty() in src/lib/properties/actions.ts — same reasoning:
 * photo storage paths are `{property_id}/...`, so the Add Listing screen
 * needs a real id to upload against before the admin ever clicks submit.
 * updateAdminProperty() re-validates and overwrites every real field on
 * submit, so this placeholder row is never what goes live.
 */
export async function initDraftAdminProperty(): Promise<{ id: string } | { error: string }> {
   const session = await requireAdmin();
   const supabase = await createClient();

   const slug = `draft-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

   const { data, error } = await supabase
      .from("properties")
      .insert({
         owner_id: session.userId,
         title: "Untitled listing",
         slug,
         property_type: "plot",
         listing_type: "sale",
         price: 0,
         city: "",
         locality: "",
         project_id: null,
         status: "draft",
         published_at: null,
      })
      .select("id")
      .single();

   if (error || !data) {
      return { error: error?.message ?? "Could not start a new listing." };
   }

   return { id: data.id };
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

/**
 * Marks / unmarks a property as Featured (0020).
 *
 * Featured is a PLACEMENT, not a move. This action writes exactly one
 * boolean column and nothing else — status, owner_id, project_id, slug,
 * location and media are all untouched — so a featured property keeps its
 * place in /properties, keeps its project relationship, and is simply also
 * eligible for the homepage Featured section. No record is duplicated.
 *
 * Authorization is enforced in three independent places, none of which
 * trusts the client: requireAdmin() here, the "admins can update any
 * property" RLS policy (0002), and the properties_featured_admin_only
 * trigger (0020), which raises if a non-admin changes is_featured at all.
 *
 * Eligibility: only a published property may be featured. The check below
 * re-reads the row's status server-side rather than trusting whatever the
 * calling page rendered, and `property_public` (which the public Featured
 * query reads) is itself published-only — so an unpublished listing cannot
 * surface publicly even if this check were bypassed.
 */
export async function setPropertyFeatured(id: string, featured: boolean): Promise<ActionResult> {
   await requireAdmin();
   const supabase = await createClient();

   if (featured) {
      const { data: property, error: readError } = await supabase
         .from("properties")
         .select("status, project_id")
         .eq("id", id)
         .maybeSingle();

      if (readError || !property) {
         return { success: false, error: "That property could not be found." };
      }
      if (property.status !== "published") {
         return { success: false, error: "Only a published property can be featured." };
      }
      if (property.project_id) {
         return {
            success: false,
            error: "Project units are featured through their parent project, not individually.",
         };
      }
   }

   const { error } = await supabase.from("properties").update({ is_featured: featured }).eq("id", id);

   if (error) {
      return { success: false, error: error.message };
   }

   revalidatePropertyPaths(id);
   revalidatePath("/");
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


// ---------------------------------------------------------------------------
// Phase 6 — full admin lifecycle for an Individual Property.
//
// These reuse the same columns, helpers and conventions as
// createAdminPropertyListing() above; nothing here is a second
// property-management system. Every action re-checks requireAdmin() for
// itself, and the database backstops are unchanged: "admins can update any
// property" (0002) authorizes the write, enforce_seller_property_update()
// (0008/0017) exempts admins, and 0018 adds the admin location/media write
// policies these actions need on rows an admin does not own.
//
// Never written from any of these actions: owner_id (a listing's seller is
// never reassigned — 0008 forbids it for non-admins and there is no
// product reason for an admin to do it either), project_id (an Individual
// Property stays project_id = NULL; attach/detach lives in
// src/lib/admin/units/actions.ts and is project-scoped there), and
// published_at other than through the status transition below.
// ---------------------------------------------------------------------------

export type AdminPropertyStatus = "draft" | "pending" | "published" | "rejected" | "sold" | "archived";

const ADMIN_PROPERTY_STATUSES: AdminPropertyStatus[] = [
   "draft",
   "pending",
   "published",
   "rejected",
   "sold",
   "archived",
];

/** Updates the listing information of any property. */
export async function updateAdminProperty(id: string, formData: FormData): Promise<ActionResult> {
   await requireAdmin();
   const supabase = await createClient();

   const title = String(formData.get("title") ?? "").trim();
   if (title.length < 3) {
      return { success: false, error: "Title must be at least 3 characters." };
   }

   const price = numberOrNull(formData.get("price"));
   if (price === null || price < 0) {
      return { success: false, error: "A valid price is required." };
   }

   const city = textOrNull(formData.get("city"));
   const locality = textOrNull(formData.get("locality"));
   if (!city || !locality) {
      return { success: false, error: "City and locality are required." };
   }

   const propertyType = textOrNull(formData.get("property_type"));
   if (!propertyType) {
      return { success: false, error: "Property type is required." };
   }

   const { error } = await supabase
      .from("properties")
      .update({
         title,
         property_type: propertyType,
         // Phase 20: always 'sale'. The rental option was removed from the
         // admin UI, and this ignores the field entirely so a hand-crafted
         // POST cannot reintroduce unsupported rental inventory.
         listing_type: "sale",
         price,
         area: numberOrNull(formData.get("area")),
         area_unit: textOrNull(formData.get("area_unit")) ?? "sqft",
         bedrooms: numberOrNull(formData.get("bedrooms")),
         bathrooms: numberOrNull(formData.get("bathrooms")),
         description: textOrNull(formData.get("description")),
         city,
         locality,
         // owner_id, project_id, slug, status, published_at are deliberately
         // absent — see the section comment above.
      })
      .eq("id", id);

   if (error) return { success: false, error: error.message };

   // The Add Listing screen now collects exact address/lat/lng on this
   // same form (see PropertyLocation.tsx) instead of only on a later,
   // separate edit-page step — so this single submit must also write
   // property_location, or an admin using "Publish immediately" could
   // still publish a listing with no map. Reuses updateAdminPropertyLocation
   // itself rather than duplicating its upsert/jitter-placeholder logic.
   const locationResult = await updateAdminPropertyLocation(id, formData);
   if (!locationResult.success) return locationResult;

   revalidatePropertyPaths(id);
   return { success: true };
}

/**
 * Creates or updates the property_location row for a property.
 *
 * Only exact_* values and the public text fields are written.
 * approx_lat/approx_lng are never set here: apply_location_jitter() (0003)
 * derives them server-side from the exact coordinates on both INSERT and
 * UPDATE OF exact_lat/exact_lng, and this action must not bypass or
 * pre-empt that — doing so is what would leak the real coordinate onto the
 * public map.
 */
export async function updateAdminPropertyLocation(id: string, formData: FormData): Promise<ActionResult> {
   await requireAdmin();
   const supabase = await createClient();

   const exactAddress = textOrNull(formData.get("exact_address"));
   const exactLat = numberOrNull(formData.get("exact_lat"));
   const exactLng = numberOrNull(formData.get("exact_lng"));

   if (!exactAddress || exactLat === null || exactLng === null) {
      return { success: false, error: "Exact address, latitude and longitude are all required." };
   }
   if (exactLat < -90 || exactLat > 90 || exactLng < -180 || exactLng > 180) {
      return { success: false, error: "Latitude must be between -90 and 90, longitude between -180 and 180." };
   }

   const { data: property, error: propertyError } = await supabase
      .from("properties")
      .select("id, city, locality")
      .eq("id", id)
      .maybeSingle();

   if (propertyError || !property) return { success: false, error: "Property not found." };

   const { data: existing } = await supabase
      .from("property_location")
      .select("property_id")
      .eq("property_id", id)
      .maybeSingle();

   const payload = {
      city: property.city,
      locality: property.locality,
      area: textOrNull(formData.get("location_area")),
      nearby_landmarks: textOrNull(formData.get("nearby_landmarks")),
      exact_address: exactAddress,
      exact_lat: exactLat,
      exact_lng: exactLng,
   };

   const { error } = existing
      ? await supabase.from("property_location").update(payload).eq("property_id", id)
      : await supabase.from("property_location").insert({
           property_id: id,
           ...payload,
           // NOT NULL columns; immediately overwritten by
           // apply_location_jitter() with a randomized 150-500m offset.
           approx_lat: exactLat,
           approx_lng: exactLng,
        });

   if (error) return { success: false, error: error.message };

   revalidatePropertyPaths(id);
   return { success: true };
}

/**
 * Sets a property's status. This is the publish / unpublish (-> draft) /
 * sold / archive control for Phase 6, on the existing property_status
 * enum — no new publication flag is introduced.
 *
 * published_at is set explicitly only when it is still null and the
 * property is going live for the first time; otherwise
 * properties_set_published_at (0002, BEFORE UPDATE) handles it.
 */
export async function setAdminPropertyStatus(id: string, status: AdminPropertyStatus): Promise<ActionResult> {
   await requireAdmin();

   if (!ADMIN_PROPERTY_STATUSES.includes(status)) {
      return { success: false, error: "Unsupported status." };
   }

   const supabase = await createClient();

   const { error } = await supabase
      .from("properties")
      .update({
         status,
         // Clear a stale rejection note whenever the listing moves back to
         // a non-rejected state, matching approveProperty() above.
         ...(status === "rejected" ? {} : { rejection_reason: null }),
      })
      .eq("id", id);

   if (error) return { success: false, error: error.message };

   revalidatePropertyPaths(id);
   return { success: true };
}

/**
 * Records an already-uploaded storage object as a property_media row.
 *
 * Same split as the project media flow: the browser uploads the bytes
 * straight to the `property-media` bucket (authorized by the storage
 * policies in 0005 / 0018), and only the resulting storage_path is handed
 * to this action, which is the sole writer of the property_media row. The
 * path is re-derived here as `{propertyId}/...` rather than trusted, so a
 * forged path cannot attach another property's object to this one.
 */
export async function addAdminPropertyMedia(id: string, formData: FormData): Promise<ActionResult> {
   await requireAdmin();
   const supabase = await createClient();

   const storagePath = textOrNull(formData.get("storage_path"));
   if (!storagePath) return { success: false, error: "No file was uploaded." };

   if (!storagePath.startsWith(`${id}/`) || storagePath.includes("..")) {
      return { success: false, error: "That file does not belong to this property." };
   }

   const mediaType = String(formData.get("media_type") ?? "image");
   if (!["image", "video", "floorplan", "document"].includes(mediaType)) {
      return { success: false, error: "Unsupported media type." };
   }

   const { error } = await supabase.from("property_media").insert({
      property_id: id,
      storage_path: storagePath,
      media_type: mediaType,
      sort_order: numberOrNull(formData.get("sort_order")) ?? 0,
   });

   if (error) return { success: false, error: error.message };

   revalidatePropertyPaths(id);
   return { success: true };
}

/** Removes a media row from a property (and its object from storage). */
export async function deleteAdminPropertyMedia(id: string, mediaId: string): Promise<ActionResult> {
   await requireAdmin();
   const supabase = await createClient();

   // Re-derive that the media row really belongs to this property before
   // deleting anything — the media id arrives from the page's own markup,
   // but it is still client-submitted.
   const { data: media, error: fetchError } = await supabase
      .from("property_media")
      .select("id, property_id, storage_path")
      .eq("id", mediaId)
      .maybeSingle();

   if (fetchError || !media || media.property_id !== id) {
      return { success: false, error: "That file does not belong to this property." };
   }

   const { error } = await supabase.from("property_media").delete().eq("id", mediaId);
   if (error) return { success: false, error: error.message };

   // Best-effort: an orphaned object costs storage but is never rendered
   // (the UI only ever lists property_media rows), so a failure here is
   // logged, not surfaced as a failed delete.
   const { error: storageError } = await supabase.storage.from("property-media").remove([media.storage_path]);
   if (storageError) console.error("Failed to remove property media object:", storageError.message);

   revalidatePropertyPaths(id);
   return { success: true };
}
