import Image from "next/image";
import Link from "next/link";
import { Project } from "./data/types";
import Location from "./detail/Location";
import Landmarks from "./detail/Landmarks";
import Connectivity from "./detail/Connectivity";
import Features from "./detail/Features";
import AreaDistribution from "./detail/AreaDistribution";
import Pricing from "./detail/Pricing";
import MasterPlan from "./detail/MasterPlan";
import FloorPlan from "./detail/FloorPlan";
import VideoTour from "./detail/VideoTour";
import Documents from "./detail/Documents";

// Every section below (Location, Landmarks, Connectivity, Features, Area
// Distribution, Pricing, Master Plan, Floor Plan, Video, Documents) renders
// nothing when its underlying Supabase data is absent — none of it is
// fabricated to fill out the layout. project_legal is never queried or
// rendered here; it's intentionally admin-only (see src/lib/projects/queries.ts).

const hasExtendedSections = (project: Project) =>
   Boolean(
      project.mapEmbedUrl ||
         project.landmarks?.length ||
         project.connectivity?.length ||
         project.features?.length ||
         project.areaDistribution?.length ||
         project.pricing?.length ||
         project.media?.masterPlan?.length ||
         project.media?.floorPlan?.length ||
         project.media?.video ||
         project.media?.documents?.length
   );

const ProjectDetail = ({ project }: { project: Project }) => {
   return (
      <div className="project-details-one mt-150 xl-mt-100 mb-170 xl-mb-100">
         <div className="container">
            <div className="row gx-xxl-5">
               <div className="col-lg-6 order-lg-first">
                  {project.images.length > 0 ? (
                     project.images.map((img, index) => (
                        <figure key={index} className="image-wrapper">
                           <Image src={img} alt={project.title} width={700} height={500} className="lazy-img w-100" />
                        </figure>
                     ))
                  ) : (
                     <div
                        className="w-100 d-flex align-items-center justify-content-center bg-light text-muted"
                        style={{ aspectRatio: "7 / 5" }}
                     >
                        Photos coming soon
                     </div>
                  )}
               </div>

               <div className="col-lg-6">
                  <div className="details-text ps-xxl-5 md-mt-40">
                     {project.tag && <div className="tag fw-500 text-uppercase">{project.tag}</div>}
                     <h3>{project.title}</h3>

                     {project.overview && <p className="fs-20 pt-20">{project.overview}</p>}

                     {(project.developer || project.location || project.projectType || project.totalArea) && (
                        <div className="project-info-outline mt-40">
                           <div className="main-bg">
                              <ul className="style-none">
                                 {project.developer && (
                                    <li className="position-relative z-1">
                                       <strong>Developer</strong>
                                       <span>{project.developer}</span>
                                    </li>
                                 )}
                                 {project.location && (
                                    <li className="position-relative z-1">
                                       <strong>Location</strong>
                                       <span>{project.location}</span>
                                    </li>
                                 )}
                                 {project.projectType && (
                                    <li className="position-relative z-1">
                                       <strong>Project Type</strong>
                                       <span>{project.projectType}</span>
                                    </li>
                                 )}
                                 {project.totalArea && (
                                    <li className="position-relative z-1">
                                       <strong>Total Area</strong>
                                       <span>
                                          {project.totalArea} {project.totalAreaUnit ?? ""}
                                       </span>
                                    </li>
                                 )}
                              </ul>
                           </div>
                        </div>
                     )}

                     <div className="mt-45">
                        <Link href="/contact" className="btn-four">
                           Enquire About This Project <i className="bi bi-arrow-up-right ms-2"></i>
                        </Link>
                     </div>
                  </div>
               </div>
            </div>

            {hasExtendedSections(project) && (
               <div className="row mt-80 lg-mt-50">
                  <div className="col-lg-10 mx-auto">
                     <div className="accordion-style-two full-accordion">
                        <div className="accordion" id="projectDetailAccordion">
                           <Location project={project} />
                           <Landmarks project={project} />
                           <Connectivity project={project} />
                           <Features project={project} />
                           <AreaDistribution project={project} />
                           <Pricing project={project} />
                           <MasterPlan project={project} />
                           <FloorPlan project={project} />
                           <VideoTour project={project} />
                           <Documents project={project} />
                        </div>
                     </div>
                  </div>
               </div>
            )}
         </div>
      </div>
   );
};

export default ProjectDetail;
