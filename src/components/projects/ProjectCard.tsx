import Image from "next/image";
import Link from "next/link";
import { Project } from "./data/types";

const ProjectCard = ({ item }: { item: Project }) => {
   return (
      <div className="project-block-two mt-80 lg-mt-40">
         <figure className="image-wrapper m0 position-relative z-1 overflow-hidden">
            {item.tag && <div className="tag fw-500 text-uppercase">{item.tag}</div>}
            <Link href={`/projects/${item.slug}`} className="d-block position-relative">
               {item.images[0] ? (
                  <Image src={item.images[0]} alt={item.title} width={700} height={500} className="w-100 tran5s" />
               ) : (
                  <div
                     className="w-100 d-flex align-items-center justify-content-center bg-light text-muted"
                     style={{ aspectRatio: "7 / 5" }}
                  >
                     Photos coming soon
                  </div>
               )}
            </Link>
         </figure>
         <div className="caption">
            <div className="d-flex justify-content-between align-items-center">
               <div className="title">
                  {item.location && <div className="date position-relative">{item.location}</div>}
                  <Link href={`/projects/${item.slug}`}>
                     <h4 className="tran3s">{item.title}</h4>
                  </Link>
               </div>
               <Link href={`/projects/${item.slug}`} className="btn-thirteen rounded-circle">
                  <i className="bi bi-arrow-up-right"></i>
               </Link>
            </div>
         </div>
      </div>
   );
};

export default ProjectCard;
