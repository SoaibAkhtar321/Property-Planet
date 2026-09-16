import Image from "next/image"
import Link from "next/link"
import ProjectCard from "@/components/projects/ProjectCard"
import PropertyCard from "@/components/properties/PropertyCard"
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

const Property = async () => {
   const [featuredProjects, featuredProperties] = await Promise.all([
      getFeaturedProjects(3),
      getFeaturedProperties(3),
   ]);

   const hasFeatured = featuredProjects.length > 0 || featuredProperties.length > 0;

   return (
      <div className="xl-mt-120 property-listing-two position-relative z-1 mt-150 pb-150 xl-pb-120 lg-pb-80">
         <div className="container">
            <div className="position-relative">
               <div className="title-one mb-25 lg-mb-20 wow fadeInUp">
                  <h2 className="font-garamond">Featured Opportunities</h2>
                  <p className="fs-22 mt-xs">Verified land, plots, villas, apartments and commercial listings across Hyderabad&apos;s growth corridors.</p>
               </div>

               {hasFeatured ? (
                  <>
                     {featuredProperties.length > 0 && (
                        <div className="row gx-xxl-5">
                           {featuredProperties.map((item) => (
                              <PropertyCard key={item.id} item={item} />
                           ))}
                        </div>
                     )}

                     {featuredProjects.length > 0 && (
                        <div className="row gx-xxl-5">
                           {featuredProjects.map((item) => (
                              <div key={item.id} className="col-lg-4 col-md-6 d-flex">
                                 <ProjectCard item={item} />
                              </div>
                           ))}
                        </div>
                     )}
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

               <div className="section-btn text-center md-mt-60">
                  <Link href="/projects" className="btn-eight"><span>Explore All</span> <i
                     className="bi bi-arrow-up-right"></i></Link>
               </div>
            </div>
         </div>
         <Image src={propertyShape} alt="" className="lazy-img shapes shape_01" />
      </div>
   )
}

export default Property;
