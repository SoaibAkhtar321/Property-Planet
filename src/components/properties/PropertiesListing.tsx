// src/components/properties/PropertiesListing.tsx
//
// Phase 7: now a server component driven entirely by the URL. Filtering,
// sorting and pagination happen in Supabase (searchPublishedProperties),
// not in the browser, so the `project_id is null` invariant holds for
// every result set the page can produce — including page 2+, which a
// client-side filter over a partially-downloaded list could never
// guarantee.
//
// Layout, classes and card markup are unchanged; only the data source and
// the header/pagination controls around the grid are new.

import Link from "next/link";
import { Property } from "./data/types";
import PropertyCard from "./PropertyCard";
import PropertyFilters, { PropertyFilterState } from "./PropertyFilters";

export interface PropertiesListingProps {
   items: Property[];
   total: number;
   page: number;
   totalPages: number;
   filters: PropertyFilterState;
   facets: {
      propertyTypes: string[];
      listingTypes: string[];
      cities: string[];
      localities: string[];
   };
}

/** Rebuilds the current query string with one value replaced — used for the pagination links. */
const buildHref = (filters: PropertyFilterState, page: number) => {
   const params = new URLSearchParams();
   const entries: [string, string][] = [
      ["q", filters.q],
      ["listingType", filters.listingType],
      ["propertyType", filters.propertyType],
      ["city", filters.city],
      ["locality", filters.locality],
      ["minPrice", filters.minPrice],
      ["maxPrice", filters.maxPrice],
      ["minArea", filters.minArea],
      ["maxArea", filters.maxArea],
      ["sort", filters.sort],
   ];
   for (const [key, value] of entries) {
      if (value) params.set(key, value);
   }
   if (page > 1) params.set("page", String(page));
   const qs = params.toString();
   return qs ? `/properties?${qs}` : "/properties";
};

const hasActiveFilters = (filters: PropertyFilterState) =>
   Boolean(
      filters.q ||
         filters.listingType ||
         filters.propertyType ||
         filters.city ||
         filters.locality ||
         filters.minPrice ||
         filters.maxPrice ||
         filters.minArea ||
         filters.maxArea
   );

const PropertiesListing = ({ items, total, page, totalPages, filters, facets }: PropertiesListingProps) => {
   const rangeStart = total === 0 ? 0 : (page - 1) * 9 + 1;
   const rangeEnd = Math.min(page * 9, total);

   // A short, bounded window of page links rather than every page, so the
   // control stays the same size on a listing of any length.
   const pageWindow: number[] = [];
   for (let p = Math.max(1, page - 2); p <= Math.min(totalPages, page + 2); p += 1) {
      pageWindow.push(p);
   }

   return (
      <div className="property-listing-six bg-pink-two pt-110 md-pt-80 pb-150 xl-pb-120 mt-150 xl-mt-120">
         <div className="container container-large">
            <div className="row">
               <div className="col-lg-8">
                  <div className="ps-xxl-5">
                     {/* Phase 13: the counterpart to the Featured
                         Opportunities heading — this page is standalone
                         listings only, and says so. */}
                     <div className="mb-40 lg-mb-30">
                        <h2 className="font-garamond">Individual Properties</h2>
                        <p className="fs-18 mt-10 mb-0">
                           Standalone plots, villas, houses and apartments. Browsing a larger development instead?{" "}
                           <Link href="/projects">See featured opportunities</Link>.
                        </p>
                     </div>

                     <div className="listing-header-filter d-sm-flex justify-content-between align-items-center mb-40 lg-mb-30">
                        <div>
                           {total > 0 ? (
                              <>
                                 Showing <span className="color-dark fw-500">{rangeStart}</span>–
                                 <span className="color-dark fw-500">{rangeEnd}</span> of{" "}
                                 <span className="color-dark fw-500">{total}</span> properties
                              </>
                           ) : (
                              <>No properties found</>
                           )}
                           {filters.locality && (
                              <>
                                 {" "}in <span className="color-dark fw-500">{filters.locality}</span>
                              </>
                           )}
                           {hasActiveFilters(filters) && (
                              <>
                                 {" "}
                                 <Link href="/properties" className="ms-2 fs-14 text-decoration-underline">
                                    Clear
                                 </Link>
                              </>
                           )}
                        </div>
                     </div>

                     <div className="row gx-xxl-5">
                        {items.map((item) => (
                           <PropertyCard key={item.id} item={item} />
                        ))}

                        {total === 0 && hasActiveFilters(filters) && (
                           <p className="fs-20">
                              No properties match these filters yet. Try widening the price or area range, or clearing a
                              filter.
                           </p>
                        )}
                        {total === 0 && !hasActiveFilters(filters) && (
                           <p className="fs-20">
                              No properties are published yet. Check back soon — new Property Planet inventory will
                              appear here as it&apos;s added.
                           </p>
                        )}
                     </div>

                     {totalPages > 1 && (
                        <nav
                           className="d-flex justify-content-center align-items-center gap-2 mt-50 flex-wrap"
                           aria-label="Property listing pages"
                        >
                           {page > 1 && (
                              <Link href={buildHref(filters, page - 1)} className="fw-500 px-3 py-2">
                                 &larr; Prev
                              </Link>
                           )}
                           {pageWindow.map((p) => (
                              <Link
                                 key={p}
                                 href={buildHref(filters, p)}
                                 // Touch target: the theme has no pagination
                                 // component, so the tap area is set here
                                 // rather than left at the text's own height.
                                 className={`px-3 py-2 ${p === page ? "fw-500 color-dark text-decoration-underline" : ""}`}
                                 aria-current={p === page ? "page" : undefined}
                                 aria-label={`Page ${p}`}
                              >
                                 {p}
                              </Link>
                           ))}
                           {page < totalPages && (
                              <Link href={buildHref(filters, page + 1)} className="fw-500 px-3 py-2">
                                 Next &rarr;
                              </Link>
                           )}
                        </nav>
                     )}
                  </div>
               </div>

               <div className="col-lg-4 order-lg-first">
                  <PropertyFilters
                     listingTypes={facets.listingTypes}
                     propertyTypes={facets.propertyTypes}
                     cities={facets.cities}
                     localities={facets.localities}
                     filters={filters}
                  />
               </div>
            </div>
         </div>
      </div>
   );
};

export default PropertiesListing;
