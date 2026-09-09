import Image from "next/image";
import { Project } from "../data/types";

const FloorPlan = ({ project }: { project: Project }) => {
   const images = project.media?.floorPlan;
   if (!images || images.length === 0) return null;

   return (
      <div className="accordion-item">
         <h2 className="accordion-header">
            <button
               className="accordion-button collapsed"
               type="button"
               data-bs-toggle="collapse"
               data-bs-target="#collapseFloorPlan"
               aria-expanded="false"
               aria-controls="collapseFloorPlan"
            >
               Floor Plans
            </button>
         </h2>
         <div id="collapseFloorPlan" className="accordion-collapse collapse">
            <div className="accordion-body">
               <div className="row">
                  {images.map((img, index) => (
                     <div key={index} className="col-md-6 mb-20">
                        <Image src={img} alt={`Floor plan ${index + 1}`} width={600} height={400} className="w-100" />
                     </div>
                  ))}
               </div>
            </div>
         </div>
      </div>
   );
};

export default FloorPlan;
