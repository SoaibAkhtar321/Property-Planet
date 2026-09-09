import { createClient } from "@/lib/supabase/server";
import { Project } from "@/components/projects/data/types";
import {
   mapProject,
   projectMediaPublicUrl,
   ProjectAreaDistributionRow,
   ProjectConnectivityRow,
   ProjectFeatureRow,
   ProjectLandmarkRow,
   ProjectMediaRow,
   ProjectPricingRow,
   ProjectPublicRow,
   ResolvedProjectMedia,
} from "./mapProject";

// project_public (0006_projects.sql) already left-joins project_location, so
// city/locality/address/lat/lng come from a single query — no separate
// project_location fetch is needed for the fields it exposes. It never
// includes project_legal, which has no public SELECT policy at all.
const PROJECT_PUBLIC_COLUMNS =
   "id, title, slug, tag, developer, project_type, total_area, total_area_unit, overview, is_featured, is_new_arrival, display_priority, seo_title, seo_description, published_at, city, locality, address, lat, lng";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

async function resolveMedia(supabase: SupabaseClient, projectIds: string[]): Promise<Map<string, ResolvedProjectMedia[]>> {
   const mediaByProject = new Map<string, ResolvedProjectMedia[]>();
   if (projectIds.length === 0) return mediaByProject;

   const { data: mediaRows, error } = await supabase
      .from("project_media")
      .select("id, project_id, storage_path, media_type, is_primary, caption, sort_order")
      .in("project_id", projectIds);

   if (error) {
      // Media is an enhancement, not the source of truth for whether a
      // project exists — log and continue with an empty media set rather
      // than failing the whole page.
      console.error("Failed to load project_media:", error.message);
      return mediaByProject;
   }

   for (const row of (mediaRows ?? []) as ProjectMediaRow[]) {
      const resolved: ResolvedProjectMedia = {
         publicUrl: projectMediaPublicUrl(supabase, row.storage_path),
         media_type: row.media_type,
         is_primary: row.is_primary,
         caption: row.caption,
         sort_order: row.sort_order,
      };
      const list = mediaByProject.get(row.project_id) ?? [];
      list.push(resolved);
      mediaByProject.set(row.project_id, list);
   }

   return mediaByProject;
}

/**
 * All published projects, ordered by the Phase 5 ordering
 * (display_priority, then published_at desc). Used by /projects — only
 * attaches media (gallery images for the card), not the full child-table
 * detail data, to avoid unnecessary queries on a listing page.
 */
export async function getPublishedProjects(): Promise<Project[]> {
   const supabase = await createClient();

   const { data, error } = await supabase
      .from("project_public")
      .select(PROJECT_PUBLIC_COLUMNS)
      .order("display_priority", { ascending: true })
      .order("published_at", { ascending: false, nullsFirst: false });

   if (error) {
      console.error("Failed to load projects:", error.message);
      return [];
   }

   const rows = (data ?? []) as ProjectPublicRow[];
   const mediaByProject = await resolveMedia(supabase, rows.map((row) => row.id));

   return rows.map((row) => mapProject(row, mediaByProject.get(row.id) ?? []));
}

/**
 * A single published project by slug, with its full child-table detail
 * data, or null if it doesn't exist / isn't published (the caller should
 * respond with notFound() in that case — project_public's `where status =
 * 'published'` means an unpublished slug simply returns no row here, same
 * as an invalid one).
 */
export async function getProjectBySlug(slug: string): Promise<Project | null> {
   const supabase = await createClient();

   const { data, error } = await supabase.from("project_public").select(PROJECT_PUBLIC_COLUMNS).eq("slug", slug).maybeSingle();

   if (error) {
      console.error("Failed to load project:", error.message);
      return null;
   }
   if (!data) return null;

   const row = data as ProjectPublicRow;

   const [mediaByProject, landmarksRes, connectivityRes, featuresRes, areaDistributionRes, pricingRes] = await Promise.all([
      resolveMedia(supabase, [row.id]),
      supabase
         .from("project_landmarks")
         .select("id, project_id, name, category, distance_label, display_order")
         .eq("project_id", row.id),
      supabase
         .from("project_connectivity")
         .select("id, project_id, type, name, distance_label, display_order")
         .eq("project_id", row.id),
      supabase.from("project_features").select("id, project_id, title, description, icon, display_order").eq("project_id", row.id),
      supabase
         .from("project_area_distribution")
         .select("id, project_id, category, value, unit, percentage, display_order")
         .eq("project_id", row.id),
      supabase
         .from("project_pricing")
         .select("id, project_id, label, price, price_unit, currency, note, display_order")
         .eq("project_id", row.id),
   ]);

   for (const [label, res] of [
      ["project_landmarks", landmarksRes],
      ["project_connectivity", connectivityRes],
      ["project_features", featuresRes],
      ["project_area_distribution", areaDistributionRes],
      ["project_pricing", pricingRes],
   ] as const) {
      if (res.error) {
         // Same reasoning as media: a missing/failed child section is
         // rendered as absent, not a fatal error for the whole page.
         console.error(`Failed to load ${label}:`, res.error.message);
      }
   }

   return mapProject(row, mediaByProject.get(row.id) ?? [], {
      landmarks: (landmarksRes.data ?? undefined) as ProjectLandmarkRow[] | undefined,
      connectivity: (connectivityRes.data ?? undefined) as ProjectConnectivityRow[] | undefined,
      features: (featuresRes.data ?? undefined) as ProjectFeatureRow[] | undefined,
      areaDistribution: (areaDistributionRes.data ?? undefined) as ProjectAreaDistributionRow[] | undefined,
      pricing: (pricingRes.data ?? undefined) as ProjectPricingRow[] | undefined,
   });
}
