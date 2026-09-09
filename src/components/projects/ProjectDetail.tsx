import Image from "next/image";
import Link from "next/link";
import { Project } from "./data/types";

// Most real-estate project sections (landmarks, connectivity, features,
// area distribution, pricing, master plan, documents, legal/RERA) are
// intentionally omitted here — no verified data exists for them yet, and
// this page must not fabricate content to fill the layout.

const ProjectDetail = ({ project }: { project: Project }) => {
   return (
      <div className="project-details-one mt-150 xl-mt-100 mb-170 xl-mb-100">
         <div className="container">
            <div className="row gx-xxl-5">
               <div className="col-lg-6 order-lg-first">
                  {project.images.map((img, index) => (
                     <figure key={index} className="image-wrapper">
                        <Image src={img} alt={project.title} width={700} height={500} className="lazy-img w-100" />
                     </figure>
                  ))}
               </div>

               <div className="col-lg-6">
                  <div className="details-text ps-xxl-5 md-mt-40">
                     {project.tag && <div className="tag fw-500 text-uppercase">{project.tag}</div>}
                     <h3>{project.title}</h3>

                     {(project.developer || project.location || project.projectType) && (
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
         </div>
      </div>
   );
};

export default ProjectDetail;
