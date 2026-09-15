import { createClient } from "@/lib/supabase/server";
import { Project, ProjectUnit } from "@/components/projects/data/types";
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
 * Unit counts for a batch of projects, in one query. Used by the listing
 * and Featured Opportunities reads so each card can show real availability
 * without an N+1 lookup per project. See getProjectUnitCounts() at the
 * bottom of this file for why `project_unit_counts` exists at all.
 */
async function resolveUnitCounts(
   supabase: SupabaseClient,
   projectIds: string[]
): Promise<Map<string, { totalUnits: number; availableUnits: number }>> {
   const counts = new Map<string, { totalUnits: number; availableUnits: number }>();
   if (projectIds.length === 0) return counts;

   const { data, error } = await supabase
      .from("project_unit_counts")
      .select("project_id, total_units, available_units")
      .in("project_id", projectIds);

   if (error) {
      // Counts are an enhancement on the card, not the reason the project
      // exists — same non-fatal handling as media above.
      console.error("Failed to load project unit counts:", error.message);
      return counts;
   }

   for (const row of data ?? []) {
      counts.set(row.project_id as string, {
         totalUnits: Number(row.total_units) || 0,
         availableUnits: Number(row.available_units) || 0,
      });
   }

   return counts;
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
   const ids = rows.map((row) => row.id);
   const [mediaByProject, countsByProject] = await Promise.all([
      resolveMedia(supabase, ids),
      resolveUnitCounts(supabase, ids),
   ]);

   return rows.map((row) => ({
      ...mapProject(row, mediaByProject.get(row.id) ?? []),
      unitCounts: countsByProject.get(row.id),
   }));
}

/**
 * Published projects marked "Featured" in the admin (project_public.is_
 * featured), ordered the same way as /projects (display_priority, then
 * published_at desc). Used by the homepage "Featured Opportunities"
 * section (src/components/homes/home-two/Property.tsx). Same media
 * handling as getPublishedProjects — gallery images only, no detail-page
 * child tables.
 */
export async function getFeaturedProjects(limit = 3): Promise<Project[]> {
   const supabase = await createClient();

   const { data, error } = await supabase
      .from("project_public")
      .select(PROJECT_PUBLIC_COLUMNS)
      .eq("is_featured", true)
      .order("display_priority", { ascending: true })
      .order("published_at", { ascending: false, nullsFirst: false })
      .limit(limit);

   if (error) {
      console.error("Failed to load featured projects:", error.message);
      return [];
   }

   const rows = (data ?? []) as ProjectPublicRow[];
   const ids = rows.map((row) => row.id);
   const [mediaByProject, countsByProject] = await Promise.all([
      resolveMedia(supabase, ids),
      resolveUnitCounts(supabase, ids),
   ]);

   return rows.map((row) => ({
      ...mapProject(row, mediaByProject.get(row.id) ?? []),
      unitCounts: countsByProject.get(row.id),
   }));
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

// ---------------------------------------------------------------------------
// Project units/plots (Phase 4)
//
// A unit is a `properties` row with project_id set (0007) — there is no
// units table. This reads `property_public`, the same published-only,
// exact-location-free view every other public property read uses, so:
//   * an unpublished/sold/archived unit is structurally absent here, not
//     filtered out in application code;
//   * every row returned is guaranteed to have a working
//     /properties/[slug] detail page, because that page reads the very
//     same view;
//   * no exact coordinate or address can leak through this path.
// ---------------------------------------------------------------------------

const PROJECT_UNIT_COLUMNS = "id, title, slug, property_type, listing_type, price, area, area_unit, bedrooms, bathrooms";

const unitTitleCase = (value: string) =>
   value
      .split(/[\s_-]+/)
      .filter(Boolean)
      .map((word) => word[0].toUpperCase() + word.slice(1))
      .join(" ");

/** The published units/plots belonging to a project, cheapest first. */
export async function getProjectUnits(projectId: string): Promise<ProjectUnit[]> {
   const supabase = await createClient();

   const { data, error } = await supabase
      .from("property_public")
      .select(PROJECT_UNIT_COLUMNS)
      .eq("project_id", projectId)
      .order("price", { ascending: true });

   if (error) {
      // Same reasoning as the child sections above: a failed unit list is
      // rendered as absent rather than failing the whole project page.
      console.error("Failed to load project units:", error.message);
      return [];
   }

   return (data ?? []).map((row) => ({
      id: row.id as string,
      slug: row.slug as string,
      title: row.title as string,
      unitType: row.property_type ? unitTitleCase(String(row.property_type)) : undefined,
      price: row.price !== null && row.price !== undefined ? Number(row.price) : undefined,
      listingType: row.listing_type === "rent" ? ("Rent" as const) : ("Sale" as const),
      area: row.area !== null && row.area !== undefined ? Number(row.area) : undefined,
      areaUnit: (row.area_unit as string | null) ?? undefined,
      bed: (row.bedrooms as number | null) ?? undefined,
      bath: (row.bathrooms as number | null) ?? undefined,
      // property_public is published-only by definition, so anything that
      // reaches here is on the market. Sold/draft units simply drop out of
      // the view rather than being listed as unavailable.
      availability: "Available",
   }));
}

export interface ProjectUnitCounts {
   totalUnits: number;
   availableUnits: number;
}

/**
 * Total vs currently-available unit counts for a published project.
 *
 * Reads `project_unit_counts` (0018), which exists precisely because a
 * public caller cannot count what it cannot read: "published properties
 * are public" (0002) hides sold/draft units, so counting through
 * property_public would make total_units identical to available_units and
 * quietly misreport a sold-out project as having no inventory at all.
 *
 * That view is aggregate-only and restricted to published projects — it
 * exposes no property row, status, price, owner or location, so nothing
 * about an individual hidden unit leaks through this call.
 */
export async function getProjectUnitCounts(projectId: string): Promise<ProjectUnitCounts | null> {
   const supabase = await createClient();

   const { data, error } = await supabase
      .from("project_unit_counts")
      .select("total_units, available_units")
      .eq("project_id", projectId)
      .maybeSingle();

   if (error || !data) {
      if (error) console.error("Failed to load project unit counts:", error.message);
      return null;
   }

   return {
      totalUnits: Number(data.total_units) || 0,
      availableUnits: Number(data.available_units) || 0,
   };
}
