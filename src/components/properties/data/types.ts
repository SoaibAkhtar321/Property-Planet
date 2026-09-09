// Canonical property data shape for Property Planet.
// Phase 3 uses local demo data conforming to this shape; Phase 4 maps
// Supabase `properties` / `property_location` / `property_media` rows to it.

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
   listingType: "Sale" | "Rent";
   propertyType: string;
   address: string;
   price: number;
   priceUnit?: string;
   sqft?: number;
   bed?: number;
   bath?: number;
   images: string[];
   overview?: string;
   overviewItems?: PropertyOverviewItem[];
   amenities?: string[];
   nearby?: PropertyNearbyItem[];
   floorPlanImages?: string[];
   videoId?: string;
   mapEmbedUrl?: string;
   featured?: boolean;
   /**
    * Marks records that exist only to demonstrate the template/layout and are
    * NOT real Property Planet inventory. Always surface this in the UI so
    * demo data is never presented as confirmed listings.
    */
   isDemo?: boolean;
}
