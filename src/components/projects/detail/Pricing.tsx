import { Project } from "../data/types";

const formatPrice = (item: NonNullable<Project["pricing"]>[number]) => {
   if (item.price === undefined) return item.note ?? "";
   const amount = `₹${item.price.toLocaleString("en-IN")}`;
   return item.priceUnit ? `${amount} ${item.priceUnit}` : amount;
};

const Pricing = ({ project }: { project: Project }) => {
   if (!project.pricing || project.pricing.length === 0) return null;

   return (
      <div className="accordion-item">
         <h2 className="accordion-header">
            <button
               className="accordion-button collapsed"
               type="button"
               data-bs-toggle="collapse"
               data-bs-target="#collapsePricing"
               aria-expanded="false"
               aria-controls="collapsePricing"
            >
               Pricing
            </button>
         </h2>
         <div id="collapsePricing" className="accordion-collapse collapse">
            <div className="accordion-body">
               <ul className="style-none d-flex flex-wrap justify-content-between nearby-list-item">
                  {project.pricing.map((item, index) => (
                     <li key={index}>
                        {item.label}
                        <span className="fw-500 color-dark">{formatPrice(item)}</span>
                        {item.note && item.price !== undefined && <span className="d-block fs-14">{item.note}</span>}
                     </li>
                  ))}
               </ul>
            </div>
         </div>
      </div>
   );
};

export default Pricing;
