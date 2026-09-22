import { Property } from "../data/types";
import PropertyCard from "../PropertyCard";

// Phase 4B (Step 8): this previously hand-rolled its own `listing-card-one`
// card markup, duplicating (and drifting from) the real PropertyCard used
// on /properties and everywhere else a property is listed. Reusing
// PropertyCard directly means this section automatically stays visually
// and functionally identical to the rest of the site (favourite button,
// Send Inquiry, See Details, empty-image state, demo tag) with no second
// card design to maintain.
const SimilarProperties = ({ items }: { items: Property[] }) => {
   if (!items || items.length === 0) return null;

   return (
      <div className="accordion-item">
         <h2 className="accordion-header">
            <button
               className="accordion-button collapsed"
               type="button"
               data-bs-toggle="collapse"
               data-bs-target="#collapseSimilar"
               aria-expanded="false"
               aria-controls="collapseSimilar"
            >
               Similar Properties
            </button>
         </h2>
         <div id="collapseSimilar" className="accordion-collapse collapse">
            <div className="accordion-body">
               <div className="row">
                  {items.map((item) => (
                     <PropertyCard key={item.id} item={item} columnClassName="col-12 col-sm-6" />
                  ))}
               </div>
            </div>
         </div>
      </div>
   );
};

export default SimilarProperties;
