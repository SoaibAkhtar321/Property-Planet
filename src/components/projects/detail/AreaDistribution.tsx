import { Project } from "../data/types";

const AreaDistribution = ({ project }: { project: Project }) => {
   if (!project.areaDistribution || project.areaDistribution.length === 0) return null;

   return (
      <div className="accordion-item">
         <h2 className="accordion-header">
            <button
               className="accordion-button collapsed"
               type="button"
               data-bs-toggle="collapse"
               data-bs-target="#collapseAreaDistribution"
               aria-expanded="false"
               aria-controls="collapseAreaDistribution"
            >
               Area / Land Distribution
            </button>
         </h2>
         <div id="collapseAreaDistribution" className="accordion-collapse collapse">
            <div className="accordion-body">
               <ul className="style-none d-flex flex-wrap justify-content-between nearby-list-item">
                  {project.areaDistribution.map((item, index) => (
                     <li key={index}>
                        {item.category}
                        <span className="fw-500 color-dark">
                           {item.value !== undefined ? `${item.value} ${item.unit ?? ""}`.trim() : ""}
                           {item.percentage !== undefined ? ` (${item.percentage}%)` : ""}
                        </span>
                     </li>
                  ))}
               </ul>
            </div>
         </div>
      </div>
   );
};

export default AreaDistribution;
