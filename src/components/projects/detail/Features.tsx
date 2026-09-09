import { Project } from "../data/types";

const Features = ({ project }: { project: Project }) => {
   if (!project.features || project.features.length === 0) return null;

   return (
      <div className="accordion-item">
         <h2 className="accordion-header">
            <button
               className="accordion-button collapsed"
               type="button"
               data-bs-toggle="collapse"
               data-bs-target="#collapseFeatures"
               aria-expanded="false"
               aria-controls="collapseFeatures"
            >
               Features
            </button>
         </h2>
         <div id="collapseFeatures" className="accordion-collapse collapse">
            <div className="accordion-body">
               <ul className="style-none d-flex flex-wrap justify-content-between list-style-two">
                  {project.features.map((item, index) => (
                     <li key={index}>
                        <strong>{item.title}</strong>
                        {item.description && <span className="d-block fs-14">{item.description}</span>}
                     </li>
                  ))}
               </ul>
            </div>
         </div>
      </div>
   );
};

export default Features;
