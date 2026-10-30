"use client"
import DashboardHeaderTwo from "@/layouts/headers/dashboard/DashboardHeaderTwo"
import Link from "next/link"
import Overview from "../add-property/Overview"
import ListingDetails from "../add-property/ListingDetails"
import PropertyLocation from "../add-property/PropertyLocation"
import PropertyMediaUpload from "../add-property/PropertyMediaUpload"
import { OwnPropertyLocation, OwnPropertyMediaRow, SellerPropertyRow } from "@/lib/properties/queries"

type EditableProperty = SellerPropertyRow & {
   description: string | null;
   rejection_reason?: string | null;
   area: number | string | null;
   area_unit: string | null;
   bedrooms: number | null;
   bathrooms: number | null;
   location: OwnPropertyLocation | null;
};

const EditPropertyBody = ({ property, media, error, onSubmit }: { property: EditableProperty | null; media: OwnPropertyMediaRow[]; error?: string; onSubmit: (formData: FormData) => Promise<void> }) => {
   if (!property) {
      return (
         <div className="dashboard-body">
            <div className="position-relative">
               <DashboardHeaderTwo title="Edit Property" />
               <div className="alert alert-danger">Listing not found, or it isn&apos;t yours to edit.</div>
               <Link href="/dashboard/properties-list" className="dash-btn-two tran3s">Back to My Properties</Link>
            </div>
         </div>
      )
   }

   // Once submitted, the listing is under admin moderation — the brief's
   // "seller listings require admin moderation" boundary means field edits
   // stop here too, matching updatePropertyListing()'s own draft-only
   // check. Media can still be managed either way (adding/removing photos
   // isn't a moderation-relevant field).
   const fieldsEditable = property.status === "draft";

   return (
      <div className="dashboard-body">
         <div className="position-relative">
            <DashboardHeaderTwo title="Edit Property" />
            <h2 className="main-title d-block d-lg-none">Edit Property</h2>

            {error && <div className="alert alert-danger mb-30" role="alert">{error}</div>}

            {/* The old banner told sellers every non-draft listing was "under
                admin review", including published and rejected ones. */}
            {property.status === "draft" && property.rejection_reason && (
               <div className="alert alert-warning mb-30" role="alert">
                  <strong>Our team&apos;s feedback on this listing:</strong> {property.rejection_reason}
                  <div className="mt-5">Update the details, then choose <em>Submit for Review</em> from My Properties.</div>
               </div>
            )}
            {!fieldsEditable && (
               <div className="alert alert-warning mb-30" role="alert">
                  {property.status === "pending" && <>This listing is <strong>waiting for admin review</strong>, so its details are locked. Photos can still be updated below.</>}
                  {property.status === "published" && <>This listing is <strong>live</strong>. To change its details, contact the Property Planet team. Photos can still be updated below.</>}
                  {property.status === "rejected" && (
                     <>
                        This listing was <strong>not approved</strong>
                        {property.rejection_reason ? <>: {property.rejection_reason}</> : "."} Choose <em>Revise &amp; Resubmit</em> from My Properties to edit it and send it again.
                     </>
                  )}
                  {!["pending", "published", "rejected"].includes(property.status) && <>This listing is <strong>{property.status}</strong>, so its details can no longer be edited.</>}
               </div>
            )}

            {fieldsEditable ? (
               <form action={onSubmit}>
                  <Overview defaults={{ title: property.title, description: property.description, property_type: property.property_type, price: property.price, price_unit: property.price_unit, price_unit_label: property.price_unit_label }} />
                  <ListingDetails defaults={{ area: property.area, area_unit: property.area_unit, bedrooms: property.bedrooms, bathrooms: property.bathrooms }} />
                  <PropertyLocation
                     defaults={{
                        city: property.city,
                        locality: property.locality,
                        locationArea: property.location?.location_area ?? undefined,
                        nearbyLandmarks: property.location?.nearby_landmarks ?? undefined,
                        exactAddress: property.location?.exact_address,
                        exactLat: property.location?.exact_lat,
                        exactLng: property.location?.exact_lng,
                     }}
                  />

                  <div className="button-group d-inline-flex align-items-center mt-30">
                     <button type="submit" className="dash-btn-two tran3s me-3">Save Changes</button>
                     <Link href="/dashboard/properties-list" className="dash-cancel-btn tran3s">Back to List</Link>
                  </div>
               </form>
            ) : (
               <div className="button-group d-inline-flex align-items-center mb-30">
                  <Link href="/dashboard/properties-list" className="dash-cancel-btn tran3s">Back to List</Link>
               </div>
            )}

            <PropertyMediaUpload propertyId={property.id} initialMedia={media} />
         </div>
      </div>
   )
}

export default EditPropertyBody
