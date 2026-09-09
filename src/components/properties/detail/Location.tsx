import { Property } from "../data/types";

const Location = ({ property }: { property: Property }) => {
   if (!property.mapEmbedUrl) return null;

   return (
      <div className="accordion-item">
         <h2 className="accordion-header">
            <button
               className="accordion-button collapsed"
               type="button"
               data-bs-toggle="collapse"
               data-bs-target="#collapseLocation"
               aria-expanded="false"
               aria-controls="collapseLocation"
            >
               Location
            </button>
         </h2>
         <div id="collapseLocation" className="accordion-collapse collapse">
            <div className="accordion-body">
               <div className="property-location">
                  <div className="wrapper">
                     <div className="map-banner">
                        <div className="gmap_canvas h-100 w-100">
                           <iframe
                              src={property.mapEmbedUrl}
                              width="600"
                              height="450"
                              style={{ border: 0 }}
                              allowFullScreen
                              loading="lazy"
                              referrerPolicy="no-referrer-when-downgrade"
                              className="w-100 h-100"
                           ></iframe>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </div>
   );
};

export default Location;
