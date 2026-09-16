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

            {!fieldsEditable && (
               <div className="alert alert-warning mb-30" role="alert">
                  This listing is <strong>{property.status}</strong> and is under admin review — details can no longer be edited here. Photos can still be updated below.
               </div>
            )}

            {fieldsEditable ? (
               <form action={onSubmit}>
                  <Overview defaults={{ title: property.title, description: property.description, property_type: property.property_type, price: property.price }} />
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
