import Image from "next/image"
import Link from "next/link"
import ProjectCard from "@/components/projects/ProjectCard"
import { getFeaturedProjects } from "@/lib/projects/queries"

import propertyShape from "@/assets/images/shape/shape_17.svg"

// Always fetch fresh — the admin "Featured" toggle should show up here
// immediately, not after a stale build (see is_featured on project_public).
export const dynamic = "force-dynamic";

const Property = async () => {
   const featuredProjects = await getFeaturedProjects(3);

   return (
      <div className="xl-mt-120 property-listing-two position-relative z-1 mt-150 pb-150 xl-pb-120 lg-pb-80">
         <div className="container">
            <div className="position-relative">
               <div className="title-one mb-25 lg-mb-20 wow fadeInUp">
                  <h2 className="font-garamond">Featured Opportunities</h2>
                  <p className="fs-22 mt-xs">Verified land, plots, villas, apartments and commercial listings across Hyderabad&apos;s growth corridors.</p>
               </div>

               {featuredProjects.length > 0 ? (
                  <div className="row gx-xxl-5">
                     {featuredProjects.map((item) => (
                        <div key={item.id} className="col-lg-4 col-md-6 d-flex">
                           <ProjectCard item={item} />
                        </div>
                     ))}
                  </div>
               ) : (
                  <p className="fs-20 mt-30">
                     No featured opportunities yet. Mark a project as &quot;Featured&quot; in the admin
                     panel to have it appear here.
                  </p>
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
