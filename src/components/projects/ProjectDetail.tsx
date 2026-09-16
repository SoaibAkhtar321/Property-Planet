import Image from "next/image";
import Link from "next/link";
import { Project, ProjectUnit } from "./data/types";
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
import Units from "./detail/Units";
import ProjectInquiryForm from "./detail/ProjectInquiryForm";

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

// Phase 9: the project information block now also reports live inventory
// (total/available units, and the price range derived from the published
// units themselves) rather than only the static project-level fields. Each
// line still renders only when the underlying data exists — nothing is
// invented to fill the layout.
const formatUnitPriceRange = (units: ProjectUnit[]) => {
   const prices = units.map((unit) => unit.price).filter((price): price is number => typeof price === "number");
   if (prices.length === 0) return undefined;

   const min = Math.min(...prices);
   const max = Math.max(...prices);
   const format = (value: number) => `₹${value.toLocaleString("en-IN")}`;

   return min === max ? format(min) : `${format(min)} – ${format(max)}`;
};

const ProjectDetail = ({
   project,
   units = [],
   unitCounts = null,
}: {
   project: Project;
   units?: ProjectUnit[];
   unitCounts?: { totalUnits: number; availableUnits: number } | null;
}) => {
   const unitPriceRange = formatUnitPriceRange(units);

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

                     {(project.developer ||
                        project.location ||
                        project.projectType ||
                        project.totalArea ||
                        unitCounts ||
                        unitPriceRange) && (
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
                                 {unitCounts && unitCounts.totalUnits > 0 && (
                                    <li className="position-relative z-1">
                                       <strong>Total Units</strong>
                                       <span>{unitCounts.totalUnits}</span>
                                    </li>
                                 )}
                                 {unitCounts && (
                                    <li className="position-relative z-1">
                                       <strong>Available Units</strong>
                                       <span>{unitCounts.availableUnits}</span>
                                    </li>
                                 )}
                                 {unitPriceRange && (
                                    <li className="position-relative z-1">
                                       <strong>Unit Price Range</strong>
                                       <span>{unitPriceRange}</span>
                                    </li>
                                 )}
                              </ul>
                           </div>
                        </div>
                     )}

                     {/* Reuses the existing leads system (project-level
                         lead: project_id set, property_id NULL) instead of
                         the old static /contact link. */}
                     <div className="mt-45" id="project-enquiry">
                        <h5 className="mb-15">Interested in this project?</h5>
                        <p className="fs-16 mb-20">
                           Send an enquiry and the Property Planet team will get back to you with availability, pricing
                           and site-visit details.
                        </p>
                        <ProjectInquiryForm projectId={project.id} projectTitle={project.title} projectLocation={project.location} />
                     </div>
                  </div>
               </div>
            </div>

            <Units units={units} unitCounts={unitCounts} />

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
                     {/* Jump-link to the existing enquiry form (same anchor
                         Units.tsx already links to as plain text) so a buyer
                         who has scrolled through location/master plan/floor
                         plan doesn't have to scroll back up to send an
                         enquiry. Reuses the existing form/section — no new
                         enquiry UI or system. */}
                     <div className="text-center mt-40">
                        <Link href="#project-enquiry" className="btn-four">
                           Send Inquiry <i className="bi bi-arrow-up-right ms-2"></i>
                        </Link>
                     </div>
                  </div>
               </div>
            )}
         </div>
      </div>
   );
};

export default ProjectDetail;
