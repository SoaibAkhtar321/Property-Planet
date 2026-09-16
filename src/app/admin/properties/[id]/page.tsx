import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getPropertyForModeration } from "@/lib/admin/properties/queries";
import {
   approveProperty,
   rejectProperty,
   updateAdminProperty,
   updateAdminPropertyLocation,
   setAdminPropertyStatus,
   setPropertyFeatured,
   addAdminPropertyMedia,
   deleteAdminPropertyMedia,
   type AdminPropertyStatus,
} from "@/lib/admin/properties/actions";
import AdminPropertyMediaUpload from "@/components/admin/properties/AdminPropertyMediaUpload";

// Phase 6: this screen is now the full lifecycle for a property, not just
// the approve/reject moderation pair. Listing information, location and
// media are all editable here, reusing the existing actions/queries and
// the same Bootstrap admin styling as /admin/projects/[id] — no second
// property-management system, and the seller's own submission flow
// (dashboard/add-property -> pending -> approve/reject) is untouched.

const STATUS_TRANSITIONS: { status: AdminPropertyStatus; label: string; className: string }[] = [
   { status: "published", label: "Publish", className: "btn-success" },
   { status: "draft", label: "Unpublish (to draft)", className: "btn-outline-secondary" },
   { status: "sold", label: "Mark sold", className: "btn-outline-warning" },
   { status: "archived", label: "Archive", className: "btn-outline-danger" },
];

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

   const toggleFeatured = async () => {
      "use server";
      await setPropertyFeatured(id, !property.is_featured);
   };

   const approve = async () => {
      "use server";
      await approveProperty(id);
   };

   const reject = async (formData: FormData) => {
      "use server";
      const reason = String(formData.get("reason") ?? "");
      await rejectProperty(id, reason);
   };

   const saveListing = updateAdminProperty.bind(null, id);
   const saveLocation = updateAdminPropertyLocation.bind(null, id);
   const addMedia = addAdminPropertyMedia.bind(null, id);

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
               <div className="mt-2 d-flex align-items-center gap-2 flex-wrap">
                  <span className="badge bg-secondary text-uppercase">{property.status}</span>
                  <span className="badge bg-light text-dark">
                     {property.project_id ? "Project unit" : "Individual property"}
                  </span>
                  <span className="text-muted small">
                     {property.published_at
                        ? `Published ${new Date(property.published_at).toLocaleDateString()}`
                        : "Never published"}
                  </span>
                  <span className="text-muted small">
                     Updated {new Date(property.updated_at).toLocaleDateString()}
                  </span>
               </div>
            </div>
            <div className="d-flex gap-2">
               <form action={approve}>
                  <button type="submit" className="btn btn-success" disabled={property.status === "published"}>
                     Approve
                  </button>
               </form>
            </div>
         </div>

         {property.project_id && (
            <div className="alert alert-info">
               This listing is a unit of a project, so it is not shown in the public Individual Properties listing.
               Manage it from{" "}
               <Link href={`/admin/projects/${property.project_id}`}>its project&apos;s Units section</Link>.
            </div>
         )}

         <div className="d-flex flex-wrap gap-2 mb-4">
            {STATUS_TRANSITIONS.filter((t) => t.status !== property.status).map((transition) => {
               const changeStatus = async () => {
                  "use server";
                  await setAdminPropertyStatus(id, transition.status);
               };
               return (
                  <form key={transition.status} action={changeStatus}>
                     <button type="submit" className={`btn btn-sm ${transition.className}`}>
                        {transition.label}
                     </button>
                  </form>
               );
            })}
         </div>

         {property.status === "rejected" && property.rejection_reason && (
            <div className="alert alert-warning">
               <strong>Previously rejected:</strong> {property.rejection_reason}
            </div>
         )}

         <h5 className="mt-4 mb-3">Listing information</h5>
         <form action={saveListing} className="border rounded p-3 d-flex flex-column gap-3 mb-4">
            <div>
               <label className="form-label">Title *</label>
               <input name="title" defaultValue={property.title} className="form-control" required minLength={3} />
            </div>
            <div className="row">
               <div className="col">
                  <label className="form-label">Property type *</label>
                  <input
                     name="property_type"
                     defaultValue={property.property_type}
                     className="form-control"
                     required
                     placeholder="plot, villa, apartment"
                  />
               </div>
               {/* Phase 20: the Sale/Rent choice is removed. Property Planet
                   does not offer rentals, so new inventory can no longer be
                   created or converted as a rental. Legacy rows keep their
                   stored listing_type — nothing is rewritten in the
                   database — they simply never appear publicly. */}
               <div className="col">
                  <label className="form-label">Price *</label>
                  <input name="price" type="number" step="0.01" defaultValue={property.price} className="form-control" required />
               </div>
            </div>
            <div className="row">
               <div className="col">
                  <label className="form-label">Area</label>
                  <input name="area" type="number" step="0.01" defaultValue={property.area ?? ""} className="form-control" />
               </div>
               <div className="col">
                  <label className="form-label">Area unit</label>
                  <input name="area_unit" defaultValue={property.area_unit ?? ""} className="form-control" placeholder="sqft, sqyd" />
               </div>
               <div className="col">
                  <label className="form-label">Bedrooms</label>
                  <input name="bedrooms" type="number" defaultValue={property.bedrooms ?? ""} className="form-control" />
               </div>
               <div className="col">
                  <label className="form-label">Bathrooms</label>
                  <input name="bathrooms" type="number" defaultValue={property.bathrooms ?? ""} className="form-control" />
               </div>
            </div>
            <div className="row">
               <div className="col">
                  <label className="form-label">City *</label>
                  <input name="city" defaultValue={property.city} className="form-control" required />
               </div>
               <div className="col">
                  <label className="form-label">Locality *</label>
                  <input name="locality" defaultValue={property.locality} className="form-control" required />
               </div>
            </div>
            <div>
               <label className="form-label">Description</label>
               <textarea name="description" defaultValue={property.description ?? ""} className="form-control" rows={4} />
            </div>
            <div className="d-flex gap-2 align-items-center">
               <button type="submit" className="btn btn-primary">
                  Save listing information
               </button>
               <span className="text-muted small">
                  Owner and project link are never changed from this form.
               </span>
            </div>
         </form>

         <div className="row g-4 mb-4">
            <div className="col-md-6">
               <div className="border rounded p-3 h-100">
                  <h6 className="text-muted">Seller</h6>
                  <div className="fw-bold">{property.owner_name ?? "—"}</div>
                  <div>{property.owner_phone ?? "No phone on file"}</div>
               </div>
            </div>
            <div className="col-md-6">
               <div className="border rounded p-3 h-100">
                  <h6 className="text-muted">Public map marker</h6>
                  {property.location ? (
                     <div className="small">
                        Buyers see {property.location.approx_lat.toFixed(5)}, {property.location.approx_lng.toFixed(5)} — a
                        randomised offset of the exact point, never the exact point itself.
                     </div>
                  ) : (
                     <div className="small text-muted">
                        No location saved yet, so this listing has no public detail page even once published.
                     </div>
                  )}
               </div>
            </div>
         </div>

         <h5 className="mb-3">Location</h5>
         <form action={saveLocation} className="border rounded p-3 d-flex flex-column gap-3 mb-4">
            <p className="text-muted small m-0">
               Exact address and coordinates are admin-only and are never returned by any public query. The public map
               marker is derived from them server-side with a randomised 150–500m offset.
            </p>
            <div>
               <label className="form-label">Exact address *</label>
               <input name="exact_address" defaultValue={property.location?.exact_address ?? ""} className="form-control" required />
            </div>
            <div className="row">
               <div className="col">
                  <label className="form-label">Exact latitude *</label>
                  <input
                     name="exact_lat"
                     type="number"
                     step="0.000001"
                     defaultValue={property.location?.exact_lat ?? ""}
                     className="form-control"
                     required
                  />
               </div>
               <div className="col">
                  <label className="form-label">Exact longitude *</label>
                  <input
                     name="exact_lng"
                     type="number"
                     step="0.000001"
                     defaultValue={property.location?.exact_lng ?? ""}
                     className="form-control"
                     required
                  />
               </div>
            </div>
            <div className="row">
               <div className="col">
                  <label className="form-label">Area description</label>
                  <input name="location_area" defaultValue={property.location?.exact_area ?? ""} className="form-control" />
               </div>
               <div className="col">
                  <label className="form-label">Nearby landmarks</label>
                  <input
                     name="nearby_landmarks"
                     defaultValue={property.location?.nearby_landmarks ?? ""}
                     className="form-control"
                  />
               </div>
            </div>
            <div>
               <button type="submit" className="btn btn-primary">
                  Save location
               </button>
            </div>
         </form>

         <h5 className="mb-3">Media</h5>
         <div className="border rounded p-3 mb-4">
            {property.media.length > 0 ? (
               <div className="d-flex flex-wrap gap-3 mb-3">
                  {property.media.map((m) => {
                     const removeMedia = async () => {
                        "use server";
                        await deleteAdminPropertyMedia(id, m.id);
                     };
                     return (
                        <div key={m.id} style={{ width: 160 }}>
                           <div style={{ width: 160, height: 120, position: "relative" }} className="border rounded overflow-hidden">
                              {m.media_type === "image" ? (
                                 <Image src={m.publicUrl} alt={property.title} fill style={{ objectFit: "cover" }} unoptimized />
                              ) : (
                                 <a
                                    href={m.publicUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="d-flex align-items-center justify-content-center h-100 text-decoration-none"
                                 >
                                    {m.media_type}
                                 </a>
                              )}
                           </div>
                           <form action={removeMedia} className="mt-1">
                              <button type="submit" className="btn btn-sm btn-outline-danger w-100">
                                 Remove
                              </button>
                           </form>
                        </div>
                     );
                  })}
               </div>
            ) : (
               <p className="text-muted small">No media yet.</p>
            )}

            <AdminPropertyMediaUpload propertyId={id} nextSortOrder={property.media.length} addMediaAction={addMedia} />
         </div>

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
