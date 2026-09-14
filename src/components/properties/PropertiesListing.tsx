"use client";

import { useMemo, useState } from "react";
import { Property } from "./data/types";
import PropertyCard from "./PropertyCard";
import PropertyFilters, { PropertyFilterState } from "./PropertyFilters";

const PropertiesListing = ({
   items,
   initialLocation,
}: {
   items: Property[];
   /** From /properties?location=<value> (homepage location cards). Matched
    * exactly against Property.locality. */
   initialLocation?: string;
}) => {
   const [filters, setFilters] = useState<PropertyFilterState>({
      listingType: "all",
      propertyType: "all",
      location: initialLocation ?? "all",
   });

   const listingTypes = useMemo(
      () => Array.from(new Set(items.map((item) => item.listingType))),
      [items]
   );
   const propertyTypes = useMemo(() => {
      // Plot/Land first: Property Planet is primarily a plot/land
      // marketplace, with other types supported as secondary categories.
      const types = Array.from(new Set(items.map((item) => item.propertyType)));
      const rank = (type: string) => (/^(plot|land)/i.test(type) ? 0 : 1);
      return types.sort((a, b) => rank(a) - rank(b));
   }, [items]);

   const filtered = useMemo(() => {
      return items.filter((item) => {
         if (filters.listingType !== "all" && item.listingType !== filters.listingType) return false;
         if (filters.propertyType !== "all" && item.propertyType !== filters.propertyType) return false;
         if (filters.location !== "all" && item.locality !== filters.location) return false;
         return true;
      });
   }, [items, filters]);

   const activeLocationHasNoMatches =
      filters.location !== "all" && !items.some((item) => item.locality === filters.location);

   return (
      <div className="property-listing-six bg-pink-two pt-110 md-pt-80 pb-150 xl-pb-120 mt-150 xl-mt-120">
         <div className="container container-large">
            <div className="row">
               <div className="col-lg-8">
                  <div className="ps-xxl-5">
                     <div className="listing-header-filter d-sm-flex justify-content-between align-items-center mb-40 lg-mb-30">
                        <div>
                           Showing <span className="color-dark fw-500">{filtered.length}</span> of{" "}
                           <span className="color-dark fw-500">{items.length}</span> properties
                           {filters.location !== "all" && (
                              <>
                                 {" "}in <span className="color-dark fw-500">{filters.location}</span>
                                 <button
                                    type="button"
                                    className="ms-2 fs-14"
                                    style={{ border: "none", background: "none", textDecoration: "underline", cursor: "pointer" }}
                                    onClick={() => setFilters((prev) => ({ ...prev, location: "all" }))}
                                 >
                                    Clear
                                 </button>
                              </>
                           )}
                        </div>
                     </div>

                     <div className="row gx-xxl-5">
                        {filtered.map((item) => (
                           <PropertyCard key={item.id} item={item} />
                        ))}
                        {items.length === 0 && (
                           <p className="fs-20">
                              No properties are published yet. Check back soon — new Property Planet
                              inventory will appear here as it&apos;s added.
                           </p>
                        )}
                        {items.length > 0 && filtered.length === 0 && activeLocationHasNoMatches && (
                           <p className="fs-20">No properties currently available in this location.</p>
                        )}
                        {items.length > 0 && filtered.length === 0 && !activeLocationHasNoMatches && (
                           <p className="fs-20">No properties match these filters yet.</p>
                        )}
                     </div>
                  </div>
               </div>

               <div className="col-lg-4 order-lg-first">
                  <PropertyFilters
                     listingTypes={listingTypes}
                     propertyTypes={propertyTypes}
                     filters={filters}
                     onChange={setFilters}
                     onReset={() => setFilters({ listingType: "all", propertyType: "all", location: "all" })}
                  />
               </div>
            </div>
         </div>
      </div>
   );
};

export default PropertiesListing;
