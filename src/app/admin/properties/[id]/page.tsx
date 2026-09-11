import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getPropertyForModeration } from "@/lib/admin/properties/queries";
import { approveProperty, rejectProperty } from "@/lib/admin/properties/actions";

export const dynamic = "force-dynamic";

export default async function AdminPropertyDetailPage({
   params,
   searchParams,
}: {
   params: Promise<{ id: string }>;
   searchParams: Promise<{ error?: string }>;
}) {
   const { id } = await params;
   const { error } = await searchParams;
   const property = await getPropertyForModeration(id);

   if (!property) {
      notFound();
   }

   const approve = async () => {
      "use server";
      await approveProperty(id);
   };

   const reject = async (formData: FormData) => {
      "use server";
      const reason = String(formData.get("reason") ?? "");
      await rejectProperty(id, reason);
   };

   return (
      <div>
         <div className="mb-3">
            <Link href="/admin/properties" className="text-decoration-none">
               ← Back to moderation queue
            </Link>
         </div>

         {error && <div className="alert alert-danger">{decodeURIComponent(error)}</div>}

         <div className="d-flex justify-content-between align-items-start mb-4">
            <div>
               <h3 className="m-0">{property.title}</h3>
               <span className="badge bg-secondary mt-2">{property.status}</span>
            </div>
            <div className="d-flex gap-2">
               <form action={approve}>
                  <button type="submit" className="btn btn-success" disabled={property.status === "published"}>
                     Approve
                  </button>
               </form>
            </div>
         </div>

         {property.status === "rejected" && property.rejection_reason && (
            <div className="alert alert-warning">
               <strong>Previously rejected:</strong> {property.rejection_reason}
            </div>
         )}

         <div className="row g-4">
            <div className="col-md-6">
               <div className="border rounded p-3">
                  <h6 className="text-muted">Basic information</h6>
                  <dl className="row mb-0">
                     <dt className="col-5">Type</dt>
                     <dd className="col-7">{property.property_type}</dd>
                     <dt className="col-5">Listing</dt>
                     <dd className="col-7">{property.listing_type}</dd>
                     <dt className="col-5">Price</dt>
                     <dd className="col-7">₹{Number(property.price).toLocaleString("en-IN")}</dd>
                     <dt className="col-5">Area</dt>
                     <dd className="col-7">
                        {property.area ? `${property.area} ${property.area_unit ?? ""}` : "—"}
                     </dd>
                     <dt className="col-5">Bedrooms</dt>
                     <dd className="col-7">{property.bedrooms ?? "—"}</dd>
                     <dt className="col-5">Bathrooms</dt>
                     <dd className="col-7">{property.bathrooms ?? "—"}</dd>
                  </dl>
                  {property.description && (
                     <div className="mt-3">
                        <div className="text-muted small">Description</div>
                        <p className="mb-0">{property.description}</p>
                     </div>
                  )}
               </div>
            </div>

            <div className="col-md-6">
               <div className="border rounded p-3 mb-4">
                  <h6 className="text-muted">Seller</h6>
                  <div className="fw-bold">{property.owner_name ?? "—"}</div>
                  <div>{property.owner_phone ?? "No phone on file"}</div>
               </div>

               <div className="border rounded p-3">
                  <h6 className="text-muted">Location</h6>
                  <div>
                     {property.city}, {property.locality}
                  </div>
                  {property.location && (
                     <>
                        <div className="text-muted small mt-2">Exact address (admin-only)</div>
                        <div>{property.location.exact_address}</div>
                        {property.location.nearby_landmarks && (
                           <div className="text-muted small mt-1">Near {property.location.nearby_landmarks}</div>
                        )}
                     </>
                  )}
               </div>
            </div>
         </div>

         {property.media.length > 0 && (
            <div className="mt-4">
               <h6 className="text-muted">Media</h6>
               <div className="d-flex flex-wrap gap-2">
                  {property.media.map((m) => (
                     <div key={m.id} style={{ width: 160, height: 120, position: "relative" }} className="border rounded overflow-hidden">
                        {m.media_type === "image" ? (
                           <Image src={m.publicUrl} alt={property.title} fill style={{ objectFit: "cover" }} unoptimized />
                        ) : (
                           <a href={m.publicUrl} target="_blank" rel="noreferrer" className="d-flex align-items-center justify-content-center h-100 text-decoration-none">
                              {m.media_type}
                           </a>
                        )}
                     </div>
                  ))}
               </div>
            </div>
         )}

         <div className="mt-4 border rounded p-3">
            <h6 className="text-muted">Reject listing</h6>
            <form action={reject} className="d-flex gap-2">
               <input
                  type="text"
                  name="reason"
                  placeholder="Reason for rejection (shown to the seller)"
                  className="form-control"
               />
               <button type="submit" className="btn btn-outline-danger text-nowrap">
                  Reject listing
               </button>
            </form>
         </div>
      </div>
   );
}
