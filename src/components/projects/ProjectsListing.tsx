import Link from "next/link";
import { Project } from "./data/types";
import ProjectCard from "./ProjectCard";

// No category filter is shown here on purpose: the old template's
// Apartments/House/Villa/Flat filter is demo-only, and with a single
// confirmed real project a filter would be inert/misleading. Reintroduce it
// once real project inventory supports it.

const ProjectsListing = ({ items }: { items: Project[] }) => {
   return (
      <div className="project-section-one mt-150 xl-mt-100 pb-150 xl-pb-100">
         <div className="container">
            {/* Phase 13: name the category explicitly. "Featured
                Opportunities" is what these are called everywhere else in
                the product; without the heading a buyer landing here
                directly has no way to tell a project from a standalone
                listing. */}
            <div className="row">
               <div className="col-lg-8">
                  <h2 className="font-garamond">Featured Opportunities</h2>
                  <p className="fs-20 mt-10">
                     Larger developments and projects. Each one contains individual units or plots you can browse and
                     enquire about. Looking for a standalone plot, villa or apartment instead?{" "}
                     <Link href="/properties">Browse individual properties</Link>.
                  </p>
               </div>
            </div>

            {items.length > 0 ? (
               <div id="canonical-projects-grid" className="grid-2column pt-10">
                  {items.map((item) => (
                     <ProjectCard key={item.id} item={item} />
                  ))}
               </div>
            ) : (
               <p className="fs-20 pt-30">
                  No featured opportunities are published yet. Check back soon — new Property Planet projects will
                  appear here as they&apos;re added. In the meantime you can{" "}
                  <Link href="/properties">browse individual properties</Link>.
               </p>
            )}
         </div>
      </div>
   );
};

export default ProjectsListing;
