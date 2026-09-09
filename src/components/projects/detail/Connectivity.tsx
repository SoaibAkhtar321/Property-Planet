import { Project } from "../data/types";

const Connectivity = ({ project }: { project: Project }) => {
   if (!project.connectivity || project.connectivity.length === 0) return null;

   return (
      <div className="accordion-item">
         <h2 className="accordion-header">
            <button
               className="accordion-button collapsed"
               type="button"
               data-bs-toggle="collapse"
               data-bs-target="#collapseConnectivity"
               aria-expanded="false"
               aria-controls="collapseConnectivity"
            >
               Connectivity
            </button>
         </h2>
         <div id="collapseConnectivity" className="accordion-collapse collapse">
            <div className="accordion-body">
               <ul className="style-none d-flex flex-wrap justify-content-between nearby-list-item">
                  {project.connectivity.map((item, index) => (
                     <li key={index}>
                        {item.name}
                        <span className="d-block fs-14">{item.type}</span>
                        {item.distanceLabel && <span className="fw-500 color-dark">{item.distanceLabel}</span>}
                     </li>
                  ))}
               </ul>
            </div>
         </div>
      </div>
   );
};

export default Connectivity;
