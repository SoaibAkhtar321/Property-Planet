import demoProjects from "./data/demoProjects";
import ProjectCard from "./ProjectCard";

// No category filter is shown here on purpose: the old template's
// Apartments/House/Villa/Flat filter is demo-only, and with a single
// confirmed real project a filter would be inert/misleading. Reintroduce it
// once real project inventory supports it.

const ProjectsListing = () => {
   return (
      <div className="project-section-one mt-150 xl-mt-100 pb-150 xl-pb-100">
         <div className="container">
            <div id="canonical-projects-grid" className="grid-2column pt-10">
               {demoProjects.map((item) => (
                  <ProjectCard key={item.id} item={item} />
               ))}
            </div>
         </div>
      </div>
   );
};

export default ProjectsListing;
