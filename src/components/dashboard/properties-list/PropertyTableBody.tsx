import Link from "next/link"
import { SellerPropertyRow } from "@/lib/properties/queries"
import { submitPropertyForReview, archivePropertyListing } from "@/lib/properties/actions"
import { priceUnitSuffix } from "@/lib/properties/priceUnit"

const statusLabel: Record<SellerPropertyRow["status"], string> = {
   draft: "Draft",
   pending: "Pending Review",
   published: "Published",
   rejected: "Rejected",
   sold: "Sold",
   archived: "Archived",
}

const statusClass: Record<SellerPropertyRow["status"], string | undefined> = {
   draft: undefined,
   pending: "pending",
   published: undefined,
   rejected: "processing",
   sold: undefined,
   archived: "processing",
}

// Bound server actions so each row's own <form> can call the action with
// its own property id — no client JS needed. Mirrors the pattern in
// src/app/admin/projects/page.tsx's StatusForm.
function SubmitForReviewForm({ id }: { id: string }) {
   const action = async () => {
      "use server"
      await submitPropertyForReview(id)
   }
   return (
      <form action={action} className="d-inline">
         <button type="submit" className="dropdown-item">Submit for Review</button>
      </form>
   )
}

function ArchiveForm({ id }: { id: string }) {
   const action = async () => {
      "use server"
      await archivePropertyListing(id)
   }
   return (
      <form action={action} className="d-inline">
         <button type="submit" className="dropdown-item">Archive</button>
      </form>
   )
}

const PropertyTableBody = ({ properties }: { properties: SellerPropertyRow[] }) => {
   if (properties.length === 0) {
      return (
         <tbody className="border-0">
            <tr>
               <td colSpan={5} className="text-center py-4">No properties yet. Add your first listing.</td>
            </tr>
         </tbody>
      )
   }

   return (
      <tbody className="border-0">
         {properties.map((item) => (
            <tr key={item.id}>
               <td>
                  <div className="d-lg-flex align-items-center position-relative">
                     <div className="ps-lg-0 py-2">
                        <span className="property-name tran3s color-dark fw-500 fs-20">{item.title}</span>
                        {(item.locality || item.city) && (
                           <div className="address">{[item.locality, item.city].filter(Boolean).join(", ")}</div>
                        )}
                        <strong className="price color-dark d-block mt-1">
                           ₹{item.price.toLocaleString()}
                           {priceUnitSuffix(item.price_unit, item.price_unit_label) && (
                              <sub>{priceUnitSuffix(item.price_unit, item.price_unit_label)}</sub>
                           )}
                        </strong>
                     </div>
                  </div>
               </td>
               <td>{new Date(item.created_at).toLocaleDateString()}</td>
               <td>{item.listing_type === "sale" ? "Sale" : "Rent"}</td>
               <td>
                  <div className={`property-status ${statusClass[item.status] ?? ""}`}>{statusLabel[item.status]}</div>
               </td>
               <td>
                  <div className="action-dots float-end">
                     <button className="action-btn dropdown-toggle" type="button" data-bs-toggle="dropdown"
                        aria-expanded="false">
                        <span></span>
                     </button>
                     <ul className="dropdown-menu dropdown-menu-end">
                        {item.status === "draft" && (
                           <>
                              <li><Link className="dropdown-item" href={`/dashboard/edit-property/${item.id}`}>Edit</Link></li>
                              <li><SubmitForReviewForm id={item.id} /></li>
                              <li><ArchiveForm id={item.id} /></li>
                           </>
                        )}
                        {item.status !== "draft" && (
                           <li><Link className="dropdown-item" href={`/dashboard/edit-property/${item.id}`}>Manage Photos</Link></li>
                        )}
                        {item.status === "published" && (
                           <li><Link className="dropdown-item" href={`/properties/${item.slug}`}>View Live</Link></li>
                        )}
                     </ul>
                  </div>
               </td>
            </tr>
         ))}
      </tbody>
   )
}

export default PropertyTableBody
