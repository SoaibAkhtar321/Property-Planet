// Canonical project data shape.
// Phase 7: src/lib/projects/mapProject.ts maps `project_public` + child
// table rows (project_landmarks, project_connectivity, project_features,
// project_area_distribution, project_pricing, project_media) onto this
// shape for the live /projects pages. demoProjects.ts (same base shape) is
// kept only as historical/dev reference and is no longer imported by the
// canonical routes.

export interface ProjectLandmark {
   name: string;
   category?: string;
   distanceLabel?: string;
}

export interface ProjectConnectivityItem {
   type: string;
   name: string;
   distanceLabel?: string;
}

export interface ProjectFeature {
   title: string;
   description?: string;
   icon?: string;
}

export interface ProjectAreaDistributionItem {
   category: string;
   value?: number;
   unit?: string;
   percentage?: number;
}

export interface ProjectPricingItem {
   label: string;
   price?: number;
   priceUnit?: string;
   currency?: string;
   note?: string;
}

export interface ProjectDocument {
   url: string;
   caption?: string;
}

export interface ProjectMedia {
   masterPlan?: string[];
   floorPlan?: string[];
   video?: string;
   documents?: ProjectDocument[];
}

export interface Project {
   id: string;
   slug: string;
   title: string;
   tag?: string;
   developer?: string;
   location?: string;
   projectType?: string;
   date?: string;
   images: string[];
   overview?: string;
   /** Admin "Featured" toggle (project_public.is_featured) — used to select
    * which projects appear in the homepage "Featured Opportunities"
    * section (src/components/homes/home-two/Property.tsx). */
   isFeatured?: boolean;
   /** Marks non-real records used only to demonstrate the layout. */
   isDemo?: boolean;

   // --- Phase 7 additions (Supabase-backed detail data) -------------------
   seoTitle?: string;
   seoDescription?: string;
   publishedAt?: string;
   /** Verified whole-project size, e.g. 17 for a 17-acre development. */
   totalArea?: number;
   totalAreaUnit?: string;
   /** Google Maps embed URL derived from project_location's lat/lng. */
   mapEmbedUrl?: string;
   landmarks?: ProjectLandmark[];
   connectivity?: ProjectConnectivityItem[];
   features?: ProjectFeature[];
   areaDistribution?: ProjectAreaDistributionItem[];
   pricing?: ProjectPricingItem[];
   /** Non-gallery media grouped by kind; gallery images live in `images`. */
   media?: ProjectMedia;
}