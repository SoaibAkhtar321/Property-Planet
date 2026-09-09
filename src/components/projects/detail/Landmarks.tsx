import { Project } from "../data/types";

const Landmarks = ({ project }: { project: Project }) => {
   if (!project.landmarks || project.landmarks.length === 0) return null;

   return (
      <div className="accordion-item">
         <h2 className="accordion-header">
            <button
               className="accordion-button collapsed"
               type="button"
               data-bs-toggle="collapse"
               data-bs-target="#collapseLandmarks"
               aria-expanded="false"
               aria-controls="collapseLandmarks"
            >
               Landmarks Nearby
            </button>
         </h2>
         <div id="collapseLandmarks" className="accordion-collapse collapse">
            <div className="accordion-body">
               <ul className="style-none d-flex flex-wrap justify-content-between nearby-list-item">
                  {project.landmarks.map((item, index) => (
                     <li key={index}>
                        {item.name}
                        {item.category ? ` — ${item.category}` : ""}
                        {item.distanceLabel && <span className="fw-500 color-dark">{item.distanceLabel}</span>}
                     </li>
                  ))}
               </ul>
            </div>
         </div>
      </div>
   );
};

export default Landmarks;
