import Image from "next/image"
import Link from "next/link"
import ProjectGridWithToggle from "@/components/projects/ProjectGridWithToggle"
import PropertyGridWithToggle from "@/components/properties/PropertyGridWithToggle"
import { getFeaturedProjects } from "@/lib/projects/queries"
import { getFeaturedProperties } from "@/lib/properties/queries"

import propertyShape from "@/assets/images/shape/shape_17.svg"

// Featured Opportunities — entirely real, admin-controlled content.
//
// Phase 20: this section used to be projects-only, because only `projects`
// had an is_featured flag. 0020 adds the same admin-only flag to
// `properties`, so an admin can now feature a standalone plot/villa here
// too, and both halves come from the database — there is no dummy or
// sample inventory anywhere in this section.
//
// Featured is an additional PLACEMENT. Everything shown here is still in
// /properties or /projects exactly as before; nothing is moved, copied or
// re-parented. See setPropertyFeatured() and migration 0020.
//
// Eligibility is the database's job, not this component's: both reads go
// through the published-only public views, so a draft/pending/rejected
// item cannot appear here even if its flag were set.
//
// force-dynamic: the admin Featured toggle should be visible immediately,
// not after the next build.
export const dynamic = "force-dynamic";

// Same reveal pattern as "Explore the Places with Most Properties"
// (BLockFeatureOne) and ExploreProperties: 4 per row, 2 rows (8) visible
// by default per half of this section, each with its own in-place "See
// More" toggle — rather than one combined "see more" link that only ever
// pointed at /projects (which did nothing for a hidden featured
// property). A generous fetch cap means the toggle has everything it
// needs client-side already; only a genuine overflow past that cap falls
// back to a plain link.
const HOMEPAGE_FEATURED_FETCH_LIMIT = 60;

const Property = async () => {
   const [featuredProjects, featuredProperties] = await Promise.all([
      getFeaturedProjects(HOMEPAGE_FEATURED_FETCH_LIMIT),
      getFeaturedProperties(HOMEPAGE_FEATURED_FETCH_LIMIT),
   ]);

   const hasFeatured = featuredProjects.length > 0 || featuredProperties.length > 0;

   return (
      <div className="property-listing-two pp-band pp-band--warm">
         <div className="container">
            <div className="position-relative">
               <div className="title-one mb-25 lg-mb-20 wow fadeInUp">
                  <h2 className="font-garamond">Featured Opportunities</h2>
                  <p className="fs-22 mt-xs">Curated land, plots, villas, apartments and commercial listings across Hyderabad&apos;s growth corridors.</p>
               </div>

               {hasFeatured ? (
                  <>
                     {featuredProperties.length > 0 && <PropertyGridWithToggle items={featuredProperties} />}
                     {featuredProjects.length > 0 && <ProjectGridWithToggle items={featuredProjects} />}
                  </>
               ) : (
                  /* Polished empty state rather than placeholder listings —
                     showing invented inventory on the homepage of a
                     property marketplace is worse than showing nothing. */
                  <div className="pp-how text-center py-5 mt-30">
                     <h5 className="mb-10">Nothing featured right now</h5>
                     <p className="fs-18 mb-25 opacity-75">
                        Our team hand-picks the strongest opportunities here. In the meantime, the full
                        inventory is open to browse.
                     </p>
                     <Link href="/properties" className="btn-four d-inline-flex">
                        Explore Properties
                     </Link>
                  </div>
               )}
            </div>
         </div>
         <Image src={propertyShape} alt="" className="lazy-img shapes shape_01" />
      </div>
   )
}

export default Property;
