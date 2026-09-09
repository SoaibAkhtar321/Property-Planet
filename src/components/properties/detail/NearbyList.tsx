import { Property } from "../data/types";

const NearbyList = ({ property }: { property: Property }) => {
   if (!property.nearby || property.nearby.length === 0) return null;

   return (
      <div className="accordion-item">
         <h2 className="accordion-header">
            <button
               className="accordion-button collapsed"
               type="button"
               data-bs-toggle="collapse"
               data-bs-target="#collapseNearby"
               aria-expanded="false"
               aria-controls="collapseNearby"
            >
               What&apos;s Nearby
            </button>
         </h2>
         <div id="collapseNearby" className="accordion-collapse collapse">
            <div className="accordion-body">
               <ul className="style-none d-flex flex-wrap justify-content-between nearby-list-item">
                  {property.nearby.map((item, index) => (
                     <li key={index}>
                        {item.title}
                        <span className="fw-500 color-dark">{item.distance}</span>
                     </li>
                  ))}
               </ul>
            </div>
         </div>
      </div>
   );
};

export default NearbyList;
