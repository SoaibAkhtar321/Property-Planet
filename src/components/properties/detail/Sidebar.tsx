import { Property } from "../data/types";
import InquiryForm from "./InquiryForm";

const Sidebar = ({ property }: { property: Property }) => {
   return (
      <div className="col-xl-4 col-lg-8 me-auto ms-auto">
         <div className="theme-sidebar-one dot-bg p-30 ms-xxl-3 lg-mt-80">
            <div className="agent-info bg-white border-20 p-30 mb-40">
               <h5 className="mb-20">Interested in this property?</h5>
               <div className="price color-dark fw-500 mb-20">
                  ₹{property.price.toLocaleString("en-IN")}
                  {property.priceUnit ? property.priceUnit : ""}
               </div>
               <InquiryForm propertyId={property.id} />
            </div>

            <div className="feature-listing bg-white border-20 p-30">
               <h5 className="mb-20">Key Facts</h5>
               <ul className="style-none">
                  <li className="d-flex justify-content-between mb-10">
                     <span>Listing Type</span>
                     <span className="fw-500 color-dark">{property.listingType}</span>
                  </li>
                  <li className="d-flex justify-content-between mb-10">
                     <span>Property Type</span>
                     <span className="fw-500 color-dark">{property.propertyType}</span>
                  </li>
                  {property.sqft && (
                     <li className="d-flex justify-content-between mb-10">
                        <span>Area</span>
                        <span className="fw-500 color-dark">{property.sqft} sqft</span>
                     </li>
                  )}
               </ul>
            </div>
         </div>
      </div>
   );
};

export default Sidebar;
