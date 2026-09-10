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
// connectivity, features, area distribution, pricing, and media
// (project_landmarks / project_connectivity / project_features /
// project_area_distribution / project_pricing / project_media) are not
// managed here yet — left for a follow-up admin screen, see the Phase 6
// report. project_legal is never written from this file.

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import { createClient } from "@/lib/supabase/server";

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
      const message = error?.code === "23505" ? "That slug is already in use." : error?.message ?? "Failed to create project.";
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
      return { success: false, error: error.code === "23505" ? "That slug is already in use." : error.message };
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
      return { success: false, error: error.message };
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
      return { success: false, error: error.message };
   }

   revalidatePath("/admin/projects");
   revalidatePath(`/admin/projects/${id}`);
   revalidatePath("/projects");
   return { success: true };
}
