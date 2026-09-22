import Link from "next/link";
import { Property } from "./data/types";
import MediaGallery from "./detail/MediaGallery";
import Overview from "./detail/Overview";
import Amenities from "./detail/Amenities";
import NearbyList from "./detail/NearbyList";
import FloorPlan from "./detail/FloorPlan";
import VideoTour from "./detail/VideoTour";
import Location from "./detail/Location";
import SimilarProperties from "./detail/SimilarProperties";
import Sidebar from "./detail/Sidebar";
import PropertyStickyCta from "./detail/PropertyStickyCta";
import FavouriteButton from "./FavouriteButton";

// Mortgage calculator and reviews are intentionally deferred (Phase 3 scope
// only covers listing/detail display) — no requirement or data model exists
// for either yet.

const PropertyDetail = ({ property, similar }: { property: Property; similar: Property[] }) => {
   return (
      <div className="listing-details-one theme-details-one mt-130 lg-mt-100 pb-150 xl-pb-120">
         <MediaGallery images={property.images} title={property.title} />
         <div className="container">
            <div className="row">
               <div className="col-lg-6">
                  {/* Phase 16/18: a Project Unit says so, and links back to
                      its project. An Individual Property renders nothing
                      here rather than any misleading project framing. */}
                  {property.project && (
                     <nav aria-label="Breadcrumb" className="mb-10">
                        <Link href={`/projects/${property.project.slug}`} className="fs-16 fw-500">
                           <i className="bi bi-arrow-left me-1" aria-hidden="true"></i>
                           Part of {property.project.title}
                        </Link>
                     </nav>
                  )}
                  {/* SEO fix (Section 17 — Heading Structure): this was an <h3>,
                      leaving the page with no <h1> at all — the property's own
                      name is the page's primary heading. */}
                  <h1 className="property-titlee">{property.title}</h1>
                  <div className="d-flex flex-wrap mt-10">
                     {property.tag && (
                        <div className="list-type text-uppercase mt-15 me-3 bg-white text-dark fw-500">
                           {property.tag}
                        </div>
                     )}
                     <div className="list-type text-uppercase mt-15 me-3 bg-white text-dark fw-500">
                        For {property.listingType}
                     </div>
                     {property.project && (
                        <div className="list-type text-uppercase mt-15 me-3 bg-white text-dark fw-500">
                           Project unit
                        </div>
                     )}
                     <div className="address mt-15">
                        <i className="bi bi-geo-alt" aria-hidden="true"></i> {property.address}
                        {/* SEO fix (Stage 2 — Internal Linking): links to the
                            existing /places/[locality] route using the same
                            raw locality value and encodeURIComponent pattern
                            already used on the homepage's "Explore the places
                            with most properties" cards
                            (BLockFeatureOne.tsx) — no new page/route, just a
                            missing cross-link between an existing property
                            and an existing locality page. Renders nothing
                            when locality is absent. */}
                        {property.locality && (
                           <>
                              {" "}
                              ·{" "}
                              <Link href={`/places/${encodeURIComponent(property.locality)}`}>
                                 More in {property.locality}
                              </Link>
                           </>
                        )}
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
                     <div className="price color-dark fw-500 d-flex align-items-center justify-content-lg-end">
                        Price: ₹{property.price.toLocaleString("en-IN")}
                        {property.priceUnit ? property.priceUnit : ""}
                        <FavouriteButton propertyId={property.id} className="position-relative ms-3" />
                     </div>
                  </div>
               </div>
            </div>

            <Overview property={property} />

            {property.project && (
               <div className="mt-30">
                  <Link href={`/projects/${property.project.slug}`} className="pp-card-btn pp-card-btn--primary px-4">
                     View {property.project.title}
                     <i className="bi bi-arrow-up-right ms-2" aria-hidden="true"></i>
                  </Link>
               </div>
            )}

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
                        {/* Phase 4B: Location moved ahead of Similar Properties so a
                            visitor finishes learning about *this* property (incl.
                            where it is) before being routed to other listings —
                            matches the info hierarchy audited in Step 2. No logic
                            changed, purely accordion order. */}
                        <Location property={property} />
                        <SimilarProperties items={similar} />
                     </div>
                  </div>
               </div>
               <Sidebar property={property} />
               <PropertyStickyCta
                  kind="property"
                  id={property.id}
                  title={property.title}
                  subtitle={property.address}
                  summaryValue={`₹${property.price.toLocaleString("en-IN")}${property.priceUnit ? property.priceUnit : ""}`}
               />
            </div>
         </div>
      </div>
   );
};

export default PropertyDetail;
