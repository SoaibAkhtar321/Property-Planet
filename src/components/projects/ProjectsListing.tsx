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
            {items.length > 0 ? (
               <div id="canonical-projects-grid" className="grid-2column pt-10">
                  {items.map((item) => (
                     <ProjectCard key={item.id} item={item} />
                  ))}
               </div>
            ) : (
               <p className="fs-20 pt-10">
                  No projects are published yet. Check back soon — new Property Planet projects will
                  appear here as they&apos;re added.
               </p>
            )}
         </div>
      </div>
   );
};

export default ProjectsListing;
