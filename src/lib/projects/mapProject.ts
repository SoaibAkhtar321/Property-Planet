import {
   Project,
   ProjectAreaDistributionItem,
   ProjectConnectivityItem,
   ProjectFeature,
   ProjectLandmark,
   ProjectPricingItem,
} from "@/components/projects/data/types";

// Row shapes matching what we actually select from Supabase.
// (project_public is the RLS-safe public view from 0006_projects.sql — it
// deliberately excludes project_legal entirely; see that file's comment on
// the view for why. Never query project_legal from public code paths.)

export interface ProjectPublicRow {
   id: string;
   title: string;
   slug: string;
   tag: string | null;
   developer: string | null;
   project_type: string | null;
   total_area: number | string | null;
   total_area_unit: string | null;
   overview: string | null;
   is_featured: boolean;
   is_new_arrival: boolean;
   display_priority: number;
   seo_title: string | null;
   seo_description: string | null;
   published_at: string | null;
   city: string | null;
   locality: string | null;
   address: string | null;
   lat: number | null;
   lng: number | null;
}

export interface ProjectMediaRow {
   id: string;
   project_id: string;
   storage_path: string;
   media_type: "gallery" | "master_plan" | "floor_plan" | "video" | "document";
   is_primary: boolean;
   caption: string | null;
   sort_order: number;
}

export interface ProjectLandmarkRow {
   id: string;
   project_id: string;
   name: string;
   category: string | null;
   distance_label: string | null;
   display_order: number;
}

export interface ProjectConnectivityRow {
   id: string;
   project_id: string;
   type: string;
   name: string;
   distance_label: string | null;
   display_order: number;
}

export interface ProjectFeatureRow {
   id: string;
   project_id: string;
   title: string;
   description: string | null;
   icon: string | null;
   display_order: number;
}

export interface ProjectAreaDistributionRow {
   id: string;
   project_id: string;
   category: string;
   value: number | string | null;
   unit: string | null;
   percentage: number | string | null;
   display_order: number;
}

export interface ProjectPricingRow {
   id: string;
   project_id: string;
   label: string;
   price: number | string | null;
   price_unit: string | null;
   currency: string;
   note: string | null;
   display_order: number;
}

export interface ResolvedProjectMedia {
   publicUrl: string;
   media_type: ProjectMediaRow["media_type"];
   is_primary: boolean;
   caption: string | null;
   sort_order: number;
}

export const projectMediaPublicUrl = (
   supabase: { storage: { from: (bucket: string) => { getPublicUrl: (path: string) => { data: { publicUrl: string } } } } },
   storagePath: string
) => supabase.storage.from("project-media").getPublicUrl(storagePath).data.publicUrl;

export interface ProjectChildRows {
   landmarks?: ProjectLandmarkRow[];
   connectivity?: ProjectConnectivityRow[];
   features?: ProjectFeatureRow[];
   areaDistribution?: ProjectAreaDistributionRow[];
   pricing?: ProjectPricingRow[];
}

const byDisplayOrder = <T extends { display_order: number }>(rows: T[]) =>
   rows.slice().sort((a, b) => a.display_order - b.display_order);

/**
 * Maps a `project_public` row plus its resolved `project_media` and child
 * table rows onto the canonical Project shape used by the /projects pages.
 *
 * Deliberately never touches project_legal — that table is intentionally
 * admin-only (no public SELECT policy, excluded from project_public) and
 * must not be queried or rendered from public pages.
 */
export function mapProject(row: ProjectPublicRow, media: ResolvedProjectMedia[], children: ProjectChildRows = {}): Project {
   const gallery = media
      .filter((m) => m.media_type === "gallery")
      .sort((a, b) => {
         if (a.is_primary !== b.is_primary) return a.is_primary ? -1 : 1;
         return a.sort_order - b.sort_order;
      })
      .map((m) => m.publicUrl);

   const masterPlanRows = media
      .filter((m) => m.media_type === "master_plan")
      .sort((a, b) => a.sort_order - b.sort_order);
   const primaryMasterPlanRows = masterPlanRows.filter((m) => m.is_primary);
   const masterPlanImages = (primaryMasterPlanRows.length === 1 ? primaryMasterPlanRows : masterPlanRows).map(
      (m) => m.publicUrl
   );
   const floorPlanImages = media
      .filter((m) => m.media_type === "floor_plan")
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((m) => m.publicUrl);

   const videoUrl = media.find((m) => m.media_type === "video")?.publicUrl;

   const documents = media
      .filter((m) => m.media_type === "document")
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((m) => ({ url: m.publicUrl, caption: m.caption ?? undefined }));

   // project_location has no exact/approximate split (a project's address is
   // meant to be publicly known — see 0006_projects.sql design note), so we
   // can render address/city/locality directly.
   const locationParts = [row.locality, row.city].filter(Boolean);
   const location = row.address ?? (locationParts.length > 0 ? locationParts.join(", ") : undefined);

   const mapEmbedUrl =
      row.lat !== null && row.lng !== null ? `https://maps.google.com/maps?q=${row.lat},${row.lng}&z=15&output=embed` : undefined;

   const landmarks: ProjectLandmark[] | undefined = children.landmarks?.length
      ? byDisplayOrder(children.landmarks).map((l) => ({
           name: l.name,
           category: l.category ?? undefined,
           distanceLabel: l.distance_label ?? undefined,
        }))
      : undefined;

   const connectivity: ProjectConnectivityItem[] | undefined = children.connectivity?.length
      ? byDisplayOrder(children.connectivity).map((c) => ({
           type: c.type,
           name: c.name,
           distanceLabel: c.distance_label ?? undefined,
        }))
      : undefined;

   const features: ProjectFeature[] | undefined = children.features?.length
      ? byDisplayOrder(children.features).map((f) => ({
           title: f.title,
           description: f.description ?? undefined,
           icon: f.icon ?? undefined,
        }))
      : undefined;

   const areaDistribution: ProjectAreaDistributionItem[] | undefined = children.areaDistribution?.length
      ? byDisplayOrder(children.areaDistribution).map((a) => ({
           category: a.category,
           value: a.value !== null ? Number(a.value) : undefined,
           unit: a.unit ?? undefined,
           percentage: a.percentage !== null ? Number(a.percentage) : undefined,
        }))
      : undefined;

   const pricing: ProjectPricingItem[] | undefined = children.pricing?.length
      ? byDisplayOrder(children.pricing).map((p) => ({
           label: p.label,
           price: p.price !== null ? Number(p.price) : undefined,
           priceUnit: p.price_unit ?? undefined,
           currency: p.currency,
           note: p.note ?? undefined,
        }))
      : undefined;

   const hasNonGalleryMedia = masterPlanImages.length > 0 || floorPlanImages.length > 0 || Boolean(videoUrl) || documents.length > 0;

   return {
      id: row.id,
      slug: row.slug,
      title: row.title,
      tag: row.tag ?? undefined,
      developer: row.developer ?? undefined,
      location,
      projectType: row.project_type ?? undefined,
      images: gallery,
      overview: row.overview ?? undefined,
      isFeatured: row.is_featured,
      seoTitle: row.seo_title ?? undefined,
      seoDescription: row.seo_description ?? undefined,
      publishedAt: row.published_at ?? undefined,
      totalArea: row.total_area !== null ? Number(row.total_area) : undefined,
      totalAreaUnit: row.total_area_unit ?? undefined,
      mapEmbedUrl,
      landmarks,
      connectivity,
      features,
      areaDistribution,
      pricing,
      media: hasNonGalleryMedia
         ? {
              masterPlan: masterPlanImages.length > 0 ? masterPlanImages : undefined,
              floorPlan: floorPlanImages.length > 0 ? floorPlanImages : undefined,
              video: videoUrl,
              documents: documents.length > 0 ? documents : undefined,
           }
         : undefined,
   };
}