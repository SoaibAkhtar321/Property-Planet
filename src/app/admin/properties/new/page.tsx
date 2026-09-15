import Link from "next/link";
import Overview from "@/components/dashboard/add-property/Overview";
import ListingDetails from "@/components/dashboard/add-property/ListingDetails";
import PropertyLocation from "@/components/dashboard/add-property/PropertyLocation";
import { createAdminPropertyListing } from "@/lib/admin/properties/actions";

export const metadata = {
   title: "Property Planet — Admin Add Listing",
};

// Reuses the same Overview / ListingDetails / PropertyLocation sections as
// the seller "Add New Property" form (src/components/dashboard/add-property)
// — same fields, same validation, same markup/classes — rather than a
// duplicate form. Only the submit action and the admin-only "publish now"
// option differ. Media upload is intentionally out of scope here too,
// matching the seller form's current state.
export default async function NewAdminPropertyPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
   const { error } = await searchParams;

   return (
      <div>
         <div className="mb-4">
            <Link href="/admin/properties">&larr; Back to properties</Link>
         </div>
         <h3 className="mb-4">Add Listing</h3>

         {error && <div className="alert alert-danger">{error}</div>}

         <form action={createAdminPropertyListing}>
            <Overview />
            <ListingDetails />
            <PropertyLocation />

            <div className="bg-white card-box border-20 mt-40">
               <h4 className="dash-title-three">Photo & Video Attachment</h4>
               <p className="fs-14 opacity-65">Media upload isn&apos;t available yet — add photos after creating the listing.</p>
            </div>

            <div className="bg-white card-box border-20 mt-40">
               <div className="form-check">
                  <input className="form-check-input" type="checkbox" id="publish_now" name="publish_now" />
                  <label className="form-check-label" htmlFor="publish_now">
                     Publish immediately (skip draft/review — admin listings can go live directly)
                  </label>
               </div>
            </div>

            <div className="button-group d-inline-flex align-items-center mt-30">
               <button type="submit" className="dash-btn-two tran3s me-3">Create listing</button>
            </div>
         </form>
      </div>
   );
}
