"use client"
import DashboardHeaderTwo from "@/layouts/headers/dashboard/DashboardHeaderTwo"
import Overview from "./Overview"
import ListingDetails from "./ListingDetails"
import PropertyLocation from "./PropertyLocation"
import { createPropertyListing } from "@/lib/properties/actions"

const AddPropertyBody = ({ error }: { error?: string }) => {
   return (
      <div className="dashboard-body">
         <div className="position-relative">
            <DashboardHeaderTwo title="Add New Property" />
            <h2 className="main-title d-block d-lg-none">Add New Property</h2>

            {error && (
               <div className="alert alert-danger mb-30" role="alert">{error}</div>
            )}

            <form action={createPropertyListing}>
               <Overview />
               <ListingDetails />
               <PropertyLocation />

               {/* A property row must exist before a storage path can
                   reference it (storage_path is `{property_id}/...`), so
                   photos/video are added on the next screen, right after
                   this form saves. Same media uploader as Edit Property —
                   see PropertyMediaUpload. */}
               <div className="bg-white card-box border-20 mt-40">
                  <h4 className="dash-title-three">Photo & Video Attachment</h4>
                  <p className="fs-14 opacity-65 m0">
                     Save the details below first, then you&apos;ll be taken straight to the photo &amp; video uploader
                     for this listing.
                  </p>
               </div>

               <div className="button-group d-inline-flex align-items-center mt-30">
                  <button type="submit" className="dash-btn-two tran3s me-3">Save &amp; Add Photos</button>
               </div>
               <p className="fs-14 opacity-65 mt-15">
                  Saved as a draft. Once photos are added, submit it for review from your property list when you&apos;re
                  ready.
               </p>
            </form>
         </div>
      </div>
   )
}

export default AddPropertyBody