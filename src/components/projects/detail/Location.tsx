import { Project } from "../data/types";

const Location = ({ project }: { project: Project }) => {
   if (!project.mapEmbedUrl) return null;

   return (
      <div className="accordion-item">
         <h2 className="accordion-header">
            <button
               className="accordion-button"
               type="button"
               data-bs-toggle="collapse"
               data-bs-target="#collapseProjectLocation"
               aria-expanded="true"
               aria-controls="collapseProjectLocation"
            >
               Location
            </button>
         </h2>
         <div id="collapseProjectLocation" className="accordion-collapse collapse show">
            <div className="accordion-body">
               {/* Same property-location/wrapper/map-banner structure as
                   src/components/properties/detail/Location.tsx — that's
                   what gives the map its full-width, properly-sized banner
                   (see .property-location .map-banner in _details_page.scss).
                   Without it the iframe falls back to its bare width/height
                   HTML attributes, which is why it was rendering as a small,
                   cropped rectangle instead of the full accordion width. */}
               <div className="property-location">
                  <div className="wrapper">
                     <div className="map-banner">
                        <div className="gmap_canvas h-100 w-100">
                           <iframe
                              src={project.mapEmbedUrl}
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
