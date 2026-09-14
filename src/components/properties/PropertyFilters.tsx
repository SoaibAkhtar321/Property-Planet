"use client";

export interface PropertyFilterState {
   listingType: string;
   propertyType: string;
   /** Exact `locality` value, or "all". Set from /properties?location=..
    * (homepage location cards) and cleared via the listing header. */
   location: string;
}

const PropertyFilters = ({
   listingTypes,
   propertyTypes,
   filters,
   onChange,
   onReset,
}: {
   listingTypes: string[];
   propertyTypes: string[];
   filters: PropertyFilterState;
   onChange: (next: PropertyFilterState) => void;
   onReset: () => void;
}) => {
   return (
      <div className="advance-search-panel dot-bg md-mt-80">
         <div className="main-bg p-30">
            <h5 className="mb-30">Filter Properties</h5>

            <div className="mb-30">
               <div className="fs-16 fw-500 mb-10">Listing Type</div>
               <select
                  className="nice-select w-100"
                  value={filters.listingType}
                  onChange={(e) => onChange({ ...filters, listingType: e.target.value })}
               >
                  <option value="all">All</option>
                  {listingTypes.map((type) => (
                     <option key={type} value={type}>
                        {type}
                     </option>
                  ))}
               </select>
            </div>

            <div className="mb-30">
               <div className="fs-16 fw-500 mb-10">Property Type</div>
               <select
                  className="nice-select w-100"
                  value={filters.propertyType}
                  onChange={(e) => onChange({ ...filters, propertyType: e.target.value })}
               >
                  <option value="all">All</option>
                  {propertyTypes.map((type) => (
                     <option key={type} value={type}>
                        {type}
                     </option>
                  ))}
               </select>
            </div>

            <button type="button" className="btn-four w-100 justify-content-center" onClick={onReset}>
               Reset Filters
            </button>
         </div>
      </div>
   );
};

export default PropertyFilters;
