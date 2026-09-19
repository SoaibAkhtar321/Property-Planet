"use server";

// src/lib/admin/projects/actions.ts
//
// Server actions backing the /admin/projects UI. Each action independently
// calls requireAdmin() — see src/lib/admin/auth.ts's comment for why this
// isn't redundant with src/middleware.ts: server actions are directly
// callable endpoints the middleware matcher does not cover on its own.
//
// Writes go through src/lib/supabase/server.ts's createClient() (the
// RLS-respecting, cookie/session-based client), never createServiceClient().
// Authorization for the actual write is enforced by the
// "admins can insert/update projects" (and project_location) RLS policies
// in 0006_projects.sql — requireAdmin() here is the app-level check in
// front of that database-level backstop, not a replacement for it.
//
// Only fields that exist in 0006_projects.sql are handled. Landmarks,
// connectivity, features, area distribution (project_landmarks /
// project_connectivity / project_features / project_area_distribution) are
// not managed here yet — left for a follow-up admin screen, see the Phase 6
// report. project_pricing is handled (see addProjectPricingRow /
// updateProjectPricingRow / deleteProjectPricingRow below), and so is
// project_media (see addProjectMediaRow / updateProjectMediaRow /
// deleteProjectMediaRow below). project_legal is never written from this
// file.

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import { createClient } from "@/lib/supabase/server";
import { friendlyError } from "@/lib/errors";

export type ProjectStatus = "draft" | "pending" | "published" | "archived";

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

/** Creates a project in `draft` status, then redirects to its edit page. */
export async function createProject(formData: FormData): Promise<void> {
   await requireAdmin();
   const supabase = await createClient();

   const title = String(formData.get("title") ?? "").trim();
   if (title.length < 3) {
      redirect("/admin/projects/new?error=" + encodeURIComponent("Title must be at least 3 characters."));
   }

   const requestedSlug = textOrNull(formData.get("slug"));
   const slug = requestedSlug ? slugify(requestedSlug) : slugify(title);

   const { data, error } = await supabase
      .from("projects")
      .insert({
         title,
         slug,
         tag: textOrNull(formData.get("tag")),
         developer: textOrNull(formData.get("developer")),
         project_type: textOrNull(formData.get("project_type")),
         total_area: numberOrNull(formData.get("total_area")),
         total_area_unit: textOrNull(formData.get("total_area_unit")),
         overview: textOrNull(formData.get("overview")),
      })
      .select("id")
      .single();

   if (error || !data) {
      const message = error?.code === "23505" ? "That slug is already in use." : friendlyError(error, "Could not create the project. Please try again.", "admin.projects.createProject");
      redirect("/admin/projects/new?error=" + encodeURIComponent(message));
   }

   revalidatePath("/admin/projects");
   redirect(`/admin/projects/${data.id}`);
}

/** Updates the core project-level fields (not location, not status). */
export async function updateProjectBasics(id: string, formData: FormData): Promise<ActionResult> {
   await requireAdmin();
   const supabase = await createClient();

   const title = String(formData.get("title") ?? "").trim();
   if (title.length < 3) {
      return { success: false, error: "Title must be at least 3 characters." };
   }

   const requestedSlug = textOrNull(formData.get("slug"));
   const slug = requestedSlug ? slugify(requestedSlug) : undefined;

   const { error } = await supabase
      .from("projects")
      .update({
         title,
         ...(slug ? { slug } : {}),
         tag: textOrNull(formData.get("tag")),
         developer: textOrNull(formData.get("developer")),
         project_type: textOrNull(formData.get("project_type")),
         total_area: numberOrNull(formData.get("total_area")),
         total_area_unit: textOrNull(formData.get("total_area_unit")),
         overview: textOrNull(formData.get("overview")),
         seo_title: textOrNull(formData.get("seo_title")),
         seo_description: textOrNull(formData.get("seo_description")),
         is_featured: formData.get("is_featured") === "on",
         is_new_arrival: formData.get("is_new_arrival") === "on",
         display_priority: numberOrNull(formData.get("display_priority")) ?? 0,
      })
      .eq("id", id);

   if (error) {
      return { success: false, error: error.code === "23505" ? "That slug is already in use." : friendlyError(error, "Could not save the project details. Please try again.", "admin.projects.updateProjectBasics") };
   }

   revalidatePath("/admin/projects");
   revalidatePath(`/admin/projects/${id}`);
   revalidatePath("/projects");
   return { success: true };
}

/** Upserts project_location (1:1 with projects) for the given project. */
export async function updateProjectLocation(id: string, formData: FormData): Promise<ActionResult> {
   await requireAdmin();
   const supabase = await createClient();

   const { error } = await supabase.from("project_location").upsert({
      project_id: id,
      city: textOrNull(formData.get("city")),
      locality: textOrNull(formData.get("locality")),
      address: textOrNull(formData.get("address")),
      lat: numberOrNull(formData.get("lat")),
      lng: numberOrNull(formData.get("lng")),
   });

   if (error) {
      return { success: false, error: friendlyError(error, "Could not save the project location. Please try again.", "admin.projects.updateProjectLocation") };
   }

   revalidatePath(`/admin/projects/${id}`);
   revalidatePath("/projects");
   return { success: true };
}

/**
 * Changes a project's status — this is how publish/unpublish/archive is
 * done. No separate delete action exists: matches the `properties`
 * convention (0002) of retiring content via status, not row deletion, and
 * `projects` (0006) has no delete RLS policy at all.
 */
export async function setProjectStatus(id: string, status: ProjectStatus): Promise<ActionResult> {
   await requireAdmin();
   const supabase = await createClient();

   const { error } = await supabase.from("projects").update({ status }).eq("id", id);

   if (error) {
      return { success: false, error: friendlyError(error, "Could not update the project status. Please try again.", "admin.projects.setProjectStatus") };
   }

   revalidatePath("/admin/projects");
   revalidatePath(`/admin/projects/${id}`);
   revalidatePath("/projects");
   return { success: true };
}

/**
 * Adds one project_pricing row. Pricing is repeatable per project (see
 * table comment in 0006_projects.sql — "different projects, or plot sizes
 * within a project, can carry different pricing shapes"), so this is an
 * insert, not an upsert: label + price_unit together identify a row for
 * display purposes, but nothing in the schema enforces their uniqueness,
 * so duplicates are the admin's call, not something this action guards
 * against.
 */
export async function addProjectPricingRow(projectId: string, formData: FormData): Promise<ActionResult> {
   await requireAdmin();
   const supabase = await createClient();

   const label = String(formData.get("label") ?? "").trim();
   if (!label) {
      return { success: false, error: "Label is required." };
   }

   const { error } = await supabase.from("project_pricing").insert({
      project_id: projectId,
      label,
      price: numberOrNull(formData.get("price")),
      price_unit: textOrNull(formData.get("price_unit")),
      currency: textOrNull(formData.get("currency")) ?? "INR",
      note: textOrNull(formData.get("note")),
      display_order: numberOrNull(formData.get("display_order")) ?? 0,
   });

   if (error) {
      return { success: false, error: friendlyError(error, "Could not add the pricing row. Please try again.", "admin.projects.addProjectPricingRow") };
   }

   revalidatePath(`/admin/projects/${projectId}`);
   // /projects/[slug] is force-dynamic (src/app/projects/[slug]/page.tsx),
   // so it always reads fresh regardless; revalidating /projects here just
   // covers the listing page's own cache.
   revalidatePath("/projects");
   return { success: true };
}

/** Updates one existing project_pricing row by its own id. */
export async function updateProjectPricingRow(
   projectId: string,
   pricingRowId: string,
   formData: FormData
): Promise<ActionResult> {
   await requireAdmin();
   const supabase = await createClient();

   const label = String(formData.get("label") ?? "").trim();
   if (!label) {
      return { success: false, error: "Label is required." };
   }

   const { error } = await supabase
      .from("project_pricing")
      .update({
         label,
         price: numberOrNull(formData.get("price")),
         price_unit: textOrNull(formData.get("price_unit")),
         currency: textOrNull(formData.get("currency")) ?? "INR",
         note: textOrNull(formData.get("note")),
         display_order: numberOrNull(formData.get("display_order")) ?? 0,
      })
      .eq("id", pricingRowId)
      // Defense-in-depth: scope the update to the project this row is
      // shown under, on top of the "admins can update project pricing" RLS
      // policy (which is unconditional for any admin) — this just prevents
      // a copy-paste bug in a future caller from updating a row under the
      // wrong project's form action.
      .eq("project_id", projectId);

   if (error) {
      return { success: false, error: friendlyError(error, "Could not update the pricing row. Please try again.", "admin.projects.updateProjectPricingRow") };
   }

   revalidatePath(`/admin/projects/${projectId}`);
   revalidatePath("/projects");
   return { success: true };
}

/** Deletes one project_pricing row by its own id. */
export async function deleteProjectPricingRow(projectId: string, pricingRowId: string): Promise<ActionResult> {
   await requireAdmin();
   const supabase = await createClient();

   const { error } = await supabase
      .from("project_pricing")
      .delete()
      .eq("id", pricingRowId)
      .eq("project_id", projectId);

   if (error) {
      return { success: false, error: friendlyError(error, "Could not delete the pricing row. Please try again.", "admin.projects.deleteProjectPricingRow") };
   }

   revalidatePath(`/admin/projects/${projectId}`);
   revalidatePath("/projects");
   return { success: true };
}

// ===========================================================================
// project_media
//
// The actual file bytes are uploaded straight from the browser to the
// `project-media` Storage bucket (see ProjectMediaUpload.tsx — same
// client-side-upload pattern as FeaturedImageUpload.tsx /
// PropertyMediaUpload.tsx), authorized by the "admins can upload project
// media objects" storage RLS policy. These actions only ever persist/edit
// the *metadata row* pointing at an already-uploaded storage_path — they
// never receive or handle file bytes themselves.
//
// is_primary note: project_media_one_primary_idx (0006_projects.sql) is a
// single partial unique index on (project_id) where is_primary = true —
// i.e. at most one primary media row per *project*, not one per
// media_type. So whenever a row is being set as primary, any existing
// primary row for the project must be cleared first in a separate
// statement, or the insert/update would hit that unique index.
// ===========================================================================

const MEDIA_TYPES = ["gallery", "master_plan", "floor_plan", "video", "document"] as const;
type ProjectMediaType = (typeof MEDIA_TYPES)[number];

const isProjectMediaType = (value: FormDataEntryValue | null): value is ProjectMediaType =>
   typeof value === "string" && (MEDIA_TYPES as readonly string[]).includes(value);

/**
 * Persists one already-uploaded file's metadata as a new project_media
 * row. Called by ProjectMediaUpload.tsx immediately after its client-side
 * storage upload succeeds — storagePath must already exist in the
 * `project-media` bucket under `{projectId}/...` by the time this runs.
 */
export async function addProjectMediaRow(projectId: string, formData: FormData): Promise<ActionResult> {
   await requireAdmin();
   const supabase = await createClient();

   const storagePath = textOrNull(formData.get("storage_path"));
   if (!storagePath) {
      return { success: false, error: "No uploaded file to save." };
   }

   const mediaTypeValue = formData.get("media_type");
   if (!isProjectMediaType(mediaTypeValue)) {
      return { success: false, error: "Invalid media type." };
   }

   const makePrimary = formData.get("is_primary") === "on";

   if (makePrimary) {
      // Clear any existing primary row for this project first — see the
      // is_primary note above. Scoped to this project only, so it can
      // never touch another project's primary flag.
      const { error: clearError } = await supabase
         .from("project_media")
         .update({ is_primary: false })
         .eq("project_id", projectId)
         .eq("is_primary", true);

      if (clearError) {
         return { success: false, error: friendlyError(clearError, "Could not update the existing primary image. Please try again.", "admin.projects.addProjectMediaRow") };
      }
   }

   const { error } = await supabase.from("project_media").insert({
      project_id: projectId,
      storage_path: storagePath,
      media_type: mediaTypeValue,
      caption: textOrNull(formData.get("caption")),
      sort_order: numberOrNull(formData.get("sort_order")) ?? 0,
      is_primary: makePrimary,
   });

   if (error) {
      return { success: false, error: friendlyError(error, "Could not add the media. Please try again.", "admin.projects.addProjectMediaRow") };
   }

   revalidatePath(`/admin/projects/${projectId}`);
   revalidatePath("/projects");
   return { success: true };
}

/** Updates one existing project_media row's editable metadata (not the file itself). */
export async function updateProjectMediaRow(
   projectId: string,
   mediaRowId: string,
   formData: FormData
): Promise<ActionResult> {
   await requireAdmin();
   const supabase = await createClient();

   const makePrimary = formData.get("is_primary") === "on";

   if (makePrimary) {
      // Clear any other row's primary flag first (see is_primary note
      // above) — excluding this row so a no-op re-save of an already-
      // primary row doesn't unset itself before the update below.
      const { error: clearError } = await supabase
         .from("project_media")
         .update({ is_primary: false })
         .eq("project_id", projectId)
         .eq("is_primary", true)
         .neq("id", mediaRowId);

      if (clearError) {
         return { success: false, error: friendlyError(clearError, "Could not update the existing primary image. Please try again.", "admin.projects.updateProjectMediaRow") };
      }
   }

   const { error } = await supabase
      .from("project_media")
      .update({
         caption: textOrNull(formData.get("caption")),
         sort_order: numberOrNull(formData.get("sort_order")) ?? 0,
         is_primary: makePrimary,
      })
      .eq("id", mediaRowId)
      // Defense-in-depth, same reasoning as updateProjectPricingRow above.
      .eq("project_id", projectId);

   if (error) {
      return { success: false, error: friendlyError(error, "Could not update the media. Please try again.", "admin.projects.updateProjectMediaRow") };
   }

   revalidatePath(`/admin/projects/${projectId}`);
   revalidatePath("/projects");
   return { success: true };
}

/**
 * Deletes one project_media row AND its underlying storage object.
 * Storage is deleted first: if that fails, the row is left intact (a
 * still-existing file with a working row beats a dangling row pointing at
 * nothing), and the caller is told to retry rather than being told it
 * succeeded. If storage deletion succeeds but the row delete then fails,
 * that is also surfaced explicitly rather than swallowed, since it leaves
 * a broken (file-less) row behind that the admin needs to know about.
 */
export async function deleteProjectMediaRow(projectId: string, mediaRowId: string): Promise<ActionResult> {
   await requireAdmin();
   const supabase = await createClient();

   const { data: row, error: fetchError } = await supabase
      .from("project_media")
      .select("id, storage_path")
      .eq("id", mediaRowId)
      .eq("project_id", projectId)
      .maybeSingle();

   if (fetchError) {
      return { success: false, error: friendlyError(fetchError, "Could not find the media record. Please refresh and try again.", "admin.projects.deleteProjectMediaRow") };
   }
   if (!row) {
      return { success: false, error: "Media item not found." };
   }

   const { error: storageError } = await supabase.storage.from("project-media").remove([row.storage_path]);
   if (storageError) {
      return { success: false, error: friendlyError(storageError, "Could not delete the file from storage. Please try again.", "admin.projects.deleteProjectMediaRow") };
   }

   const { error: deleteError } = await supabase
      .from("project_media")
      .delete()
      .eq("id", mediaRowId)
      .eq("project_id", projectId);

   if (deleteError) {
      return {
         success: false,
         error: friendlyError(deleteError, "The file was removed from storage, but its record could not be deleted. Please refresh and try again.", "admin.projects.deleteProjectMediaRow"),
      };
   }

   revalidatePath(`/admin/projects/${projectId}`);
   revalidatePath("/projects");
   return { success: true };
}
