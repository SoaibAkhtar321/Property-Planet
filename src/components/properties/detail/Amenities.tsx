import { Property } from "../data/types";

const Amenities = ({ property }: { property: Property }) => {
   if (!property.amenities || property.amenities.length === 0) return null;

   return (
      <div className="accordion-item">
         <h2 className="accordion-header">
            <button
               className="accordion-button"
               type="button"
               data-bs-toggle="collapse"
               data-bs-target="#collapseAmenities"
               aria-expanded="true"
               aria-controls="collapseAmenities"
            >
               Amenities
            </button>
         </h2>
         <div id="collapseAmenities" className="accordion-collapse collapse show">
            <div className="accordion-body">
               <ul className="style-none d-flex flex-wrap justify-content-between list-style-two">
                  {property.amenities.map((item, index) => (
                     <li key={index}>{item}</li>
                  ))}
               </ul>
            </div>
         </div>
      </div>
   );
};

export default Amenities;
