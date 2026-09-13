// src/lib/admin/projects/queries.ts
//
// Admin-only project reads. Unlike src/lib/projects/queries.ts (which
// reads project_public — published rows only, via anon-safe RLS), these
// functions read the base `projects` table directly so an admin can see
// drafts/pending/archived projects too. This is safe because:
//   * every call site is behind requireAdmin() (src/app/admin/**),
//   * the read still goes through createClient() (RLS-respecting, not the
//     service-role client), and the "admins can read all projects" /
//     "admins can read all project locations" policies in
//     0006_projects.sql are what actually authorize the wider read.
//
// Deliberately never selects from project_legal — that stays admin-UI-out
// of scope until a dedicated, explicitly-requested legal-info screen is
// built. Nothing here fetches or renders it.

import { createClient } from "@/lib/supabase/server";

export interface AdminProjectListRow {
   id: string;
   title: string;
   slug: string;
   status: "draft" | "pending" | "published" | "archived";
   is_featured: boolean;
   is_new_arrival: boolean;
   display_priority: number;
   published_at: string | null;
   updated_at: string;
}

export interface AdminProjectRow extends AdminProjectListRow {
   tag: string | null;
   developer: string | null;
   project_type: string | null;
   total_area: number | string | null;
   total_area_unit: string | null;
   overview: string | null;
   seo_title: string | null;
   seo_description: string | null;
   created_at: string;
}

export interface AdminProjectLocationRow {
   project_id: string;
   city: string | null;
   locality: string | null;
   address: string | null;
   lat: number | null;
   lng: number | null;
}

export interface AdminProjectPricingRow {
   id: string;
   project_id: string;
   label: string;
   price: number | string | null;
   price_unit: string | null;
   currency: string;
   note: string | null;
   display_order: number;
}

export interface AdminProjectMediaRow {
   id: string;
   project_id: string;
   storage_path: string;
   media_type: "gallery" | "master_plan" | "floor_plan" | "video" | "document";
   is_primary: boolean;
   caption: string | null;
   sort_order: number;
   created_at: string;
}

/** All projects regardless of status, for the /admin/projects list. */
export async function getAllProjectsForAdmin(): Promise<AdminProjectListRow[]> {
   const supabase = await createClient();

   const { data, error } = await supabase
      .from("projects")
      .select("id, title, slug, status, is_featured, is_new_arrival, display_priority, published_at, updated_at")
      .order("updated_at", { ascending: false });

   if (error) {
      console.error("Failed to load admin project list:", error.message);
      return [];
   }

   return (data ?? []) as AdminProjectListRow[];
}

/** A single project (any status) plus its location, for the edit form. Null if not found. */
export async function getProjectForAdmin(
   id: string
): Promise<{ project: AdminProjectRow; location: AdminProjectLocationRow | null } | null> {
   const supabase = await createClient();

   const { data: project, error } = await supabase
      .from("projects")
      .select(
         "id, title, slug, status, tag, developer, project_type, total_area, total_area_unit, overview, seo_title, seo_description, is_featured, is_new_arrival, display_priority, published_at, created_at, updated_at"
      )
      .eq("id", id)
      .maybeSingle();

   if (error) {
      console.error("Failed to load project for admin:", error.message);
      return null;
   }
   if (!project) return null;

   const { data: location, error: locationError } = await supabase
      .from("project_location")
      .select("project_id, city, locality, address, lat, lng")
      .eq("project_id", id)
      .maybeSingle();

   if (locationError) {
      console.error("Failed to load project_location for admin:", locationError.message);
   }

   return { project: project as AdminProjectRow, location: (location as AdminProjectLocationRow | null) ?? null };
}

/**
 * All pricing rows for a project, in display order. Reads the base
 * `project_pricing` table directly (not a `*_public` view — there isn't
 * one for pricing) since every call site here is behind requireAdmin();
 * the "project pricing follows project visibility" RLS policy already
 * lets an admin read pricing for a project of any status, same as every
 * other admin project read in this file.
 */
export async function getProjectPricing(projectId: string): Promise<AdminProjectPricingRow[]> {
   const supabase = await createClient();

   const { data, error } = await supabase
      .from("project_pricing")
      .select("id, project_id, label, price, price_unit, currency, note, display_order")
      .eq("project_id", projectId)
      .order("display_order", { ascending: true });

   if (error) {
      console.error("Failed to load project pricing for admin:", error.message);
      return [];
   }

   return (data ?? []) as AdminProjectPricingRow[];
}

/**
 * All media rows for a project, across every media_type. Reads the base
 * `project_media` table directly (same reasoning as getProjectPricing
 * above) — the "project media follows project visibility" RLS policy
 * already lets an admin read media for a project of any status.
 *
 * Ordered by media_type then sort_order then created_at so the admin UI
 * can group rows per type (Master Plan, Gallery, Floor Plan, Documents,
 * Video) and render each group in a stable, predictable order without
 * having to re-sort client-side.
 */
export async function getProjectMedia(projectId: string): Promise<AdminProjectMediaRow[]> {
   const supabase = await createClient();

   const { data, error } = await supabase
      .from("project_media")
      .select("id, project_id, storage_path, media_type, is_primary, caption, sort_order, created_at")
      .eq("project_id", projectId)
      .order("media_type", { ascending: true })
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

   if (error) {
      console.error("Failed to load project media for admin:", error.message);
      return [];
   }

   return (data ?? []) as AdminProjectMediaRow[];
}
