import { Project } from "../data/types";

const Documents = ({ project }: { project: Project }) => {
   const documents = project.media?.documents;
   if (!documents || documents.length === 0) return null;

   return (
      <div className="accordion-item">
         <h2 className="accordion-header">
            <button
               className="accordion-button collapsed"
               type="button"
               data-bs-toggle="collapse"
               data-bs-target="#collapseDocuments"
               aria-expanded="false"
               aria-controls="collapseDocuments"
            >
               Documents
            </button>
         </h2>
         <div id="collapseDocuments" className="accordion-collapse collapse">
            <div className="accordion-body">
               <ul className="style-none">
                  {documents.map((doc, index) => (
                     <li key={index} className="mb-2">
                        <a href={doc.url} target="_blank" rel="noopener noreferrer">
                           {doc.caption || `Document ${index + 1}`}
                        </a>
                     </li>
                  ))}
               </ul>
            </div>
         </div>
      </div>
   );
};

export default Documents;
