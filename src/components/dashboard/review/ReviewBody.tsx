"use client"
import DashboardHeaderTwo from "@/layouts/headers/dashboard/DashboardHeaderTwo"
import NiceSelect from "@/ui/NiceSelect";
// TODO(user-review): UserReview is disabled — its current data
// (src/components/dashboard/review/UserReview.tsx) is static template/demo
// content: fabricated reviewer names, ratings, dates, and Lorem ipsum text
// presented as real buyer reviews. Do not re-enable until this is wired to
// real review data. Component file is intentionally left in place for that
// future work.
// import UserReview from "./UserReview";

const ReviewBody = () => {

   const selectHandler = (e: any) => { };

   return (
      <div className="dashboard-body">
         <div className="position-relative">
            <DashboardHeaderTwo title="Review" />
            <h2 className="main-title d-block d-lg-none">Reviews</h2>

            <div className="d-sm-flex align-items-center justify-content-between mb-25">
               <div className="fs-16">Reviews</div>
               <div className="d-flex ms-auto xs-mt-30">
                  <div className="short-filter d-flex align-items-center ms-sm-auto">
                     <div className="fs-16 me-2">Short by:</div>
                     <NiceSelect className="nice-select"
                        options={[
                           { value: "1", text: "Newest" },
                           { value: "2", text: "Best Rating" },
                           { value: "3", text: "Rating Low" },
                           { value: "4", text: "Rating High" },
                        ]}
                        defaultCurrent={0}
                        onChange={selectHandler}
                        name=""
                        placeholder="" />
                  </div>
               </div>
            </div>

            <div className="bg-white card-box pt-0 border-20">
               <div className="theme-details-one">
                  <div className="review-panel-one">
                     <div className="position-relative z-1">
                        <div className="review-wrapper">
                           {/* UserReview disabled — see TODO(user-review) above */}
                           <p className="fs-16 py-4 text-center">No reviews yet.</p>
                        </div>
                     </div>
                  </div>
               </div>
            </div>

            {/* Pagination disabled — see TODO(user-review) above; it implied paginated review data that doesn't exist yet */}
         </div>
      </div>
   )
}

export default ReviewBody
