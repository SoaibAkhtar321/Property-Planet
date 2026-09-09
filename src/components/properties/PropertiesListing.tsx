"use client";

import { useMemo, useState } from "react";
import demoProperties from "./data/demoProperties";
import PropertyCard from "./PropertyCard";
import PropertyFilters, { PropertyFilterState } from "./PropertyFilters";

const PropertiesListing = () => {
   const [filters, setFilters] = useState<PropertyFilterState>({
      listingType: "all",
      propertyType: "all",
   });

   const listingTypes = useMemo(
      () => Array.from(new Set(demoProperties.map((item) => item.listingType))),
      []
   );
   const propertyTypes = useMemo(
      () => Array.from(new Set(demoProperties.map((item) => item.propertyType))),
      []
   );

   const filtered = useMemo(() => {
      return demoProperties.filter((item) => {
         if (filters.listingType !== "all" && item.listingType !== filters.listingType) return false;
         if (filters.propertyType !== "all" && item.propertyType !== filters.propertyType) return false;
         return true;
      });
   }, [filters]);

   return (
      <div className="property-listing-six bg-pink-two pt-110 md-pt-80 pb-150 xl-pb-120 mt-150 xl-mt-120">
         <div className="container container-large">
            <div className="row">
               <div className="col-lg-8">
                  <div className="ps-xxl-5">
                     <div className="listing-header-filter d-sm-flex justify-content-between align-items-center mb-40 lg-mb-30">
                        <div>
                           Showing <span className="color-dark fw-500">{filtered.length}</span> of{" "}
                           <span className="color-dark fw-500">{demoProperties.length}</span> properties
                        </div>
                     </div>

                     <div className="row gx-xxl-5">
                        {filtered.map((item) => (
                           <PropertyCard key={item.id} item={item} />
                        ))}
                        {filtered.length === 0 && (
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
                     onReset={() => setFilters({ listingType: "all", propertyType: "all" })}
                  />
               </div>
            </div>
         </div>
      </div>
   );
};

export default PropertiesListing;
