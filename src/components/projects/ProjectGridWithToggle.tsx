"use client"

import { useState } from "react"
import ProjectCard from "./ProjectCard"
import { Project } from "./data/types"

// Mirrors PropertyGridWithToggle / BLockFeatureOne: 4 per row, 2 rows (8)
// visible by default, in-place "See More" / "See Less" toggle over
// already-fetched items rather than a link elsewhere.
const CARDS_PER_ROW = 4
const VISIBLE_ROWS = 2
const INITIAL_VISIBLE = CARDS_PER_ROW * VISIBLE_ROWS

const ProjectGridWithToggle = ({ items }: { items: Project[] }) => {
   const [showAll, setShowAll] = useState(false)
   const visibleItems = showAll ? items : items.slice(0, INITIAL_VISIBLE)
   const hasMore = items.length > INITIAL_VISIBLE

   return (
      <>
         <div className="row gx-xxl-5">
            {visibleItems.map((item) => (
               <div key={item.id} className="col-lg-3 col-md-6 d-flex">
                  <ProjectCard item={item} />
               </div>
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

export default ProjectGridWithToggle
