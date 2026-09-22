// src/components/properties/PropertyFilters.tsx
//
// Phase 7: the filter panel is now a plain GET form that submits to
// /properties, so every filter, sort and page is expressible as a URL —
// shareable, bookmarkable, back-button-safe, and server-rendered. That
// also means filtering happens in Supabase (see searchPublishedProperties)
// rather than in the browser over a fully-downloaded listing set, which is
// what makes `project_id is null` enforceable for search results.
//
// The markup, classes and panel layout are unchanged from the previous
// client-state version — same advance-search-panel styling, same controls
// in the same order, with the new fields following the same pattern.

export interface PropertyFilterState {
   q: string;
   propertyType: string;
   city: string;
   /** Exact `locality` value, or "" for all. Also set from the homepage
    * locality cards via /properties?locality=<value>. */
   locality: string;
   minPrice: string;
   maxPrice: string;
   minArea: string;
   maxArea: string;
   sort: string;
}

const PropertyFilters = ({
   propertyTypes,
   cities,
   localities,
   filters,
}: {
   propertyTypes: string[];
   cities: string[];
   localities: string[];
   filters: PropertyFilterState;
}) => {
   return (
      <aside className="advance-search-panel dot-bg md-mt-80" aria-label="Property filters">
         <div className="main-bg p-30">
            <h5 className="mb-30">Filter Properties</h5>

            {/* GET form: submitting rewrites the URL, which is the single
                source of truth for the whole listing page. */}
            <form method="get" action="/properties">
               <div className="mb-30">
                  <label className="fs-16 fw-500 mb-10 d-block" htmlFor="filter-q">
                     Keyword
                  </label>
                  <input
                     type="text"
                     id="filter-q" name="q"
                     defaultValue={filters.q}
                     placeholder="Title, description or area"
                     className="w-100"
                  />
               </div>

               {/* Phase 20: the Sale/Rent control is gone. Property Planet
                   lists plots, land and homes for sale only, so offering a
                   listing-type choice advertised a product that does not
                   exist. Public search is sale-only server-side too — see
                   SALE_ONLY in src/lib/properties/queries.ts. */}

               <div className="mb-30">
                  <label className="fs-16 fw-500 mb-10 d-block" htmlFor="filter-property-type">
                     Property Type
                  </label>
                  <select className="nice-select w-100" id="filter-property-type" name="propertyType" defaultValue={filters.propertyType}>
                     <option value="">All</option>
                     {propertyTypes.map((type) => (
                        <option key={type} value={type}>
                           {type}
                        </option>
                     ))}
                  </select>
               </div>

               <div className="mb-30">
                  <label className="fs-16 fw-500 mb-10 d-block" htmlFor="filter-city">
                     City
                  </label>
                  <select className="nice-select w-100" id="filter-city" name="city" defaultValue={filters.city}>
                     <option value="">All</option>
                     {cities.map((city) => (
                        <option key={city} value={city}>
                           {city}
                        </option>
                     ))}
                  </select>
               </div>

               <div className="mb-30">
                  <label className="fs-16 fw-500 mb-10 d-block" htmlFor="filter-locality">
                     Locality
                  </label>
                  <select className="nice-select w-100" id="filter-locality" name="locality" defaultValue={filters.locality}>
                     <option value="">All</option>
                     {localities.map((locality) => (
                        <option key={locality} value={locality}>
                           {locality}
                        </option>
                     ))}
                  </select>
               </div>

               <div className="mb-30">
                  <div className="fs-16 fw-500 mb-10" id="filter-price-label">Price Range (₹)</div>
                  <div className="d-flex gap-2">
                     <input type="number" name="minPrice" min={0} defaultValue={filters.minPrice} placeholder="Min" aria-label="Minimum price" className="w-100" />
                     <input type="number" name="maxPrice" min={0} defaultValue={filters.maxPrice} placeholder="Max" aria-label="Maximum price" className="w-100" />
                  </div>
               </div>

               <div className="mb-30">
                  <div className="fs-16 fw-500 mb-10" id="filter-area-label">Area</div>
                  <div className="d-flex gap-2">
                     <input type="number" name="minArea" min={0} defaultValue={filters.minArea} placeholder="Min" aria-label="Minimum area" className="w-100" />
                     <input type="number" name="maxArea" min={0} defaultValue={filters.maxArea} placeholder="Max" aria-label="Maximum area" className="w-100" />
                  </div>
               </div>

               <div className="mb-30">
                  <label className="fs-16 fw-500 mb-10 d-block" htmlFor="filter-sort">
                     Sort By
                  </label>
                  <select className="nice-select w-100" id="filter-sort" name="sort" defaultValue={filters.sort}>
                     <option value="newest">Newest first</option>
                     <option value="price_asc">Price: low to high</option>
                     <option value="price_desc">Price: high to low</option>
                     <option value="area_desc">Largest area</option>
                  </select>
               </div>

               {/* Phase 4A: .btn-four is a 50x50px square icon-only button
                   (fixed height, 1.3em icon-sized font) -- forcing it full
                   width with w-100 kept the fixed height/oversized font but
                   dropped the fixed width, so these two full-width text
                   CTAs rendered squashed and oversized instead of like the
                   rest of the site's buttons. Swapped for .pp-card-btn, the
                   same button already used for every card action (Send
                   Inquiry / See Details) elsewhere on this exact page. */}
               <button type="submit" className="pp-card-btn pp-card-btn--primary w-100 justify-content-center mb-15">
                  Apply Filters
               </button>
               <a href="/properties" className="pp-card-btn pp-card-btn--ghost w-100 justify-content-center">
                  Reset Filters
               </a>
            </form>
         </div>
      </aside>
   );
};

export default PropertyFilters;
