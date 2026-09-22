"use client"

import { useState } from "react"
import feature_data from "@/data/home-data/FeatureData"
import Link from "next/link"

// 4 cards per row (col-lg-3) x 2 rows shown by default.
const CARDS_PER_ROW = 4
const VISIBLE_ROWS = 2
const INITIAL_VISIBLE = CARDS_PER_ROW * VISIBLE_ROWS

const BLockFeatureOne = () => {
   const [showAll, setShowAll] = useState(false)
   const locations = feature_data.filter((items) => items.page === "home_2_feature_1")
   const visibleLocations = showAll ? locations : locations.slice(0, INITIAL_VISIBLE)
   const hasMore = locations.length > INITIAL_VISIBLE

   return (
      // {/* No top margin here for the same reason as ExploreProperties: the
      //     preceding section already ends in bottom padding, so an added
      //     mt-150 was doubling the gap. */}
            <div className="block-feature-six pp-band pp-band--warm">
         <div className="container">
            <div className="position-relative z-1">
               <div className="row">
                  <div className="col-xl-9 m-auto">
                     <div className="title-one text-center mb-35 lg-mb-20 wow fadeInUp">
                        <h2 className="font-garamond">Explore the Places with Most Properties</h2>
                        <p className="fs-22 mt-xs">Allows you to search for the best and latest properties & projects in different location. Search by area below to find your perfect place.</p>
                     </div>
                  </div>
               </div>

               <div className="row gx-xxl-5">
                  {visibleLocations.map((item) => (
                     <div key={item.id} className="col-lg-3 col-md-6 wow fadeInUp" data-wow-delay={item.data_delay_time}>
                        <div
                           className="location-card-two position-relative z-1 d-flex align-items-center justify-content-center mt-30"
                           style={item.imgUrl ? { backgroundImage: `url(${item.imgUrl})` } : undefined}
                        >
                           <div className="content">
                              <h5 className="text-white font-garamond">{item.title}</h5>
                           </div>
                           <Link
                              href={`/places/${encodeURIComponent(item.location ?? item.title)}`}
                              className="stretched-link"
                           ></Link>
                        </div>
                     </div>
                  ))}
               </div>

               {hasMore && (
                  <div className="row">
                     <div className="col-12 mt-40">
                        <button
                           type="button"
                           className="btn-five sm"
                           onClick={() => setShowAll((prev) => !prev)}
                        >
                           {showAll ? "See Less" : "See More"}
                        </button>
                     </div>
                  </div>
               )}
            </div>
         </div>
      </div>
   )
}

export default BLockFeatureOne
