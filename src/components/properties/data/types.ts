// Canonical property data shape for Property Planet.
// Phase 4: src/lib/properties/mapProperty.ts maps `property_public` +
// `property_media` rows onto this shape for the live /properties pages.
// demoProperties.ts (same shape) is kept only as historical/dev reference
// and is no longer imported by the canonical routes.

export interface PropertyOverviewItem {
   label: string;
   value: string;
}

export interface PropertyNearbyItem {
   title: string;
   distance: string;
}

export interface Property {
   id: string;
   slug: string;
   title: string;
   tag?: string;
   /** Always "Sale" on public surfaces — Property Planet does not offer
    *  rentals. The legacy `listing_type` column still exists in the
    *  database (and legacy 'rent' rows are preserved), but public reads are
    *  filtered to sale-only; see SALE_ONLY in src/lib/properties/queries.ts. */
   listingType: "Sale";
   propertyType: string;
   address: string;
   /** Raw locality value (property_public.locality), used for the
    * homepage "Explore the places with most properties" location filter. */
   locality?: string;
   price: number;
   priceUnit?: string;
   sqft?: number;
   bed?: number;
   bath?: number;
   images: string[];
   /**
    * Parent project (properties.project_id, 0007). Undefined => Individual
    * Property; set => Project Unit. Present so the unit's own detail page
    * can say which project it belongs to and link back to it, without any
    * second discovery route for units.
    */
   projectId?: string;
   /** Resolved parent-project display info, only when projectId is set. */
   project?: { id: string; title: string; slug: string };
   overview?: string;
   overviewItems?: PropertyOverviewItem[];
   amenities?: string[];
   nearby?: PropertyNearbyItem[];
   floorPlanImages?: string[];
   /**
    * Public URL of an uploaded video-tour file (property_media,
    * media_type='video'). Not a YouTube ID — the schema stores uploaded
    * media, not embed IDs, so VideoTour renders this with a plain <video>
    * element rather than the template's YouTube popup.
    */
   videoUrl?: string;
   mapEmbedUrl?: string;
   featured?: boolean;
   /**
    * Marks records that exist only to demonstrate the template/layout and are
    * NOT real Property Planet inventory. Always surface this in the UI so
    * demo data is never presented as confirmed listings.
    */
   isDemo?: boolean;
}