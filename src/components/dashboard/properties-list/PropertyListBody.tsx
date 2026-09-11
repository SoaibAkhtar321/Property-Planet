import DashboardHeaderTwo from "@/layouts/headers/dashboard/DashboardHeaderTwo"
import PropertyTableBody from "./PropertyTableBody";
import Link from "next/link";
import { getOwnActivePropertyListings } from "@/lib/properties/queries";

// Real Supabase-backed list (Phase 2) — the original template's
// "Showing 1-5 of 40 results", sort dropdown, and page-number pagination
// had no backing data source and have been dropped rather than faked.
// Pagination/sorting can come back once the seller's listing count
// justifies it.
const PropertyListBody = async () => {
   const properties = await getOwnActivePropertyListings();

   return (
      <div className="dashboard-body">
         <div className="position-relative">
            <DashboardHeaderTwo title="My Properties" />
            <h2 className="main-title d-block d-lg-none">My Properties</h2>
            <div className="d-sm-flex align-items-center justify-content-between mb-25">
               <div className="fs-16"><span className="color-dark fw-500">{properties.length}</span> {properties.length === 1 ? "listing" : "listings"}</div>
               <Link href="/dashboard/add-property" className="dash-btn-two tran3s">+ Add Property</Link>
            </div>

            <div className="bg-white card-box p0 border-20">
               <div className="table-responsive pt-25 pb-25 pe-4 ps-4">
                  <table className="table property-list-table">
                     <thead>
                        <tr>
                           <th scope="col">Title</th>
                           <th scope="col">Date</th>
                           <th scope="col">Listing</th>
                           <th scope="col">Status</th>
                           <th scope="col">Action</th>
                        </tr>
                     </thead>
                     <PropertyTableBody properties={properties} />
                  </table>
               </div>
            </div>
         </div>
      </div>
   )
}

export default PropertyListBody
