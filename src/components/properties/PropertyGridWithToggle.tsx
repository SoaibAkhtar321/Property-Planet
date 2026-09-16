"use client"

import { useState } from "react"
import PropertyCard from "./PropertyCard"
import { Property } from "./data/types"

// Same reveal pattern as BLockFeatureOne ("Explore the Places with Most
// Properties"): 4 cards per row (col-lg-3), 2 rows visible by default,
// and a "See More" / "See Less" toggle that expands in place rather than
// navigating away — instead of a link to /properties. All items are
// already fetched server-side and handed to this client component, so
// toggling is instant with no extra request.
const CARDS_PER_ROW = 4
const VISIBLE_ROWS = 2
const INITIAL_VISIBLE = CARDS_PER_ROW * VISIBLE_ROWS

const PropertyGridWithToggle = ({ items, isFavouritedIds }: { items: Property[]; isFavouritedIds?: Set<string> }) => {
   const [showAll, setShowAll] = useState(false)
   const visibleItems = showAll ? items : items.slice(0, INITIAL_VISIBLE)
   const hasMore = items.length > INITIAL_VISIBLE

   return (
      <>
         <div className="row gx-xxl-5">
            {visibleItems.map((item) => (
               <PropertyCard
                  key={item.id}
                  item={item}
                  isFavourited={isFavouritedIds?.has(item.id)}
                  columnClassName="col-md-6 col-lg-3"
               />
            ))}
         </div>

         {hasMore && (
            <div className="row">
               <div className="col-12 text-center mt-10">
                  <button type="button" className="btn-five sm" onClick={() => setShowAll((prev) => !prev)}>
                     {showAll ? "See Less" : "See More"}
                  </button>
               </div>
            </div>
         )}
      </>
   )
}

export default PropertyGridWithToggle
