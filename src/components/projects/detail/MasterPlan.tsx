import Image from "next/image";
import Fancybox from "@/components/common/Fancybox";
import { Project } from "../data/types";

const MasterPlan = ({ project }: { project: Project }) => {
   const images = project.media?.masterPlan;
   if (!images || images.length === 0) return null;

   return (
      <div className="accordion-item">
         <h2 className="accordion-header">
            <button
               className="accordion-button collapsed"
               type="button"
               data-bs-toggle="collapse"
               data-bs-target="#collapseMasterPlan"
               aria-expanded="false"
               aria-controls="collapseMasterPlan"
            >
               Master Plan
            </button>
         </h2>
         <div id="collapseMasterPlan" className="accordion-collapse collapse">
            <div className="accordion-body">
               {/* Same Fancybox lightbox used for the property photo gallery
                   (src/components/properties/detail/MediaGallery.tsx) —
                   clicking a thumbnail opens a pannable/zoomable, full-size
                   view instead of the fixed 600x400 inline image. */}
               <Fancybox options={{ Carousel: { infinite: images.length > 1 } }}>
                  <div className="row">
                     {images.map((img, index) => (
                        <div key={index} className="col-md-6 mb-20">
                           <a href={img} data-fancybox="master-plan" aria-label={`Master plan ${index + 1}, click to zoom`}>
                              <Image src={img} alt={`Master plan ${index + 1}`} width={600} height={400} className="w-100" />
                           </a>
                        </div>
                     ))}
                  </div>
               </Fancybox>
            </div>
         </div>
      </div>
   );
};

export default MasterPlan;
