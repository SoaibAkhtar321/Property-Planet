// Canonical project data shape. Phase 4 will introduce dedicated
// project/project_location/project_features/etc. tables — this shape is
// kept clean enough to map onto that future schema.

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
   /** Marks non-real records used only to demonstrate the layout. */
   isDemo?: boolean;
}
