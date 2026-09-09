import { Property } from "./data/types";
import demoProperties from "./data/demoProperties";
import MediaGallery from "./detail/MediaGallery";
import Overview from "./detail/Overview";
import Amenities from "./detail/Amenities";
import NearbyList from "./detail/NearbyList";
import FloorPlan from "./detail/FloorPlan";
import VideoTour from "./detail/VideoTour";
import Location from "./detail/Location";
import SimilarProperties from "./detail/SimilarProperties";
import Sidebar from "./detail/Sidebar";

// Mortgage calculator and reviews are intentionally deferred (Phase 3 scope
// only covers listing/detail display) — no requirement or data model exists
// for either yet.

const PropertyDetail = ({ property }: { property: Property }) => {
   const similar = demoProperties.filter((item) => item.slug !== property.slug).slice(0, 2);

   return (
      <div className="listing-details-one theme-details-one mt-130 lg-mt-100 pb-150 xl-pb-120">
         <MediaGallery images={property.images} title={property.title} />
         <div className="container">
            <div className="row">
               <div className="col-lg-6">
                  <h3 className="property-titlee">{property.title}</h3>
                  <div className="d-flex flex-wrap mt-10">
                     {property.tag && (
                        <div className="list-type text-uppercase mt-15 me-3 bg-white text-dark fw-500">
                           {property.tag}
                        </div>
                     )}
                     <div className="address mt-15">
                        <i className="bi bi-geo-alt"></i> {property.address}
                     </div>
                  </div>
                  {property.isDemo && (
                     <div className="fs-14 mt-15" style={{ color: "#8a6d00" }}>
                        This is demo data for layout purposes only — not a confirmed Property Planet listing.
                     </div>
                  )}
               </div>
               <div className="col-lg-6 text-lg-end">
                  <div className="d-inline-block md-mt-40">
                     <div className="price color-dark fw-500">
                        Price: ₹{property.price.toLocaleString("en-IN")}
                        {property.priceUnit ? property.priceUnit : ""}
                     </div>
                  </div>
               </div>
            </div>

            <Overview property={property} />

            <div className="row">
               <div className="col-xl-8">
                  <div className="accordion-style-two full-accordion">
                     <div className="accordion" id="propertyDetailAccordion">
                        {property.overview && (
                           <div className="accordion-item">
                              <h2 className="accordion-header">
                                 <button
                                    className="accordion-button"
                                    type="button"
                                    data-bs-toggle="collapse"
                                    data-bs-target="#collapsePropertyOverview"
                                    aria-expanded="true"
                                    aria-controls="collapsePropertyOverview"
                                 >
                                    Overview
                                 </button>
                              </h2>
                              <div id="collapsePropertyOverview" className="accordion-collapse collapse show">
                                 <div className="accordion-body">
                                    <p className="fs-20 lh-lg m0">{property.overview}</p>
                                 </div>
                              </div>
                           </div>
                        )}
                        <Amenities property={property} />
                        <VideoTour property={property} />
                        <FloorPlan property={property} />
                        <NearbyList property={property} />
                        <SimilarProperties items={similar} />
                        <Location property={property} />
                     </div>
                  </div>
               </div>
               <Sidebar property={property} />
            </div>
         </div>
      </div>
   );
};

export default PropertyDetail;
