import { Project } from "../data/types";

const Location = ({ project }: { project: Project }) => {
   if (!project.mapEmbedUrl) return null;

   return (
      <div className="accordion-item">
         <h2 className="accordion-header">
            <button
               className="accordion-button"
               type="button"
               data-bs-toggle="collapse"
               data-bs-target="#collapseProjectLocation"
               aria-expanded="true"
               aria-controls="collapseProjectLocation"
            >
               Location
            </button>
         </h2>
         <div id="collapseProjectLocation" className="accordion-collapse collapse show">
            <div className="accordion-body">
               <div className="gmap_canvas h-100 w-100">
                  <iframe
                     src={project.mapEmbedUrl}
                     width="600"
                     height="450"
                     style={{ border: 0 }}
                     allowFullScreen
                     loading="lazy"
                     referrerPolicy="no-referrer-when-downgrade"
                     className="w-100 h-100"
                  ></iframe>
               </div>
            </div>
         </div>
      </div>
   );
};

export default Location;
