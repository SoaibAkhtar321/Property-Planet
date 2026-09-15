// src/components/admin/projects/ProjectUnits.tsx
//
// The "Units / Plots" section of the admin project edit screen. Kept as a
// server component in its own file so src/app/admin/projects/[id]/page.tsx
// stays readable; markup follows the same Bootstrap conventions as the
// Pricing and Media sections already on that page — no new design system,
// no new dependency.
//
// Every mutation goes through src/lib/admin/units/actions.ts, which calls
// requireAdmin() itself. The project id is bound server-side here and is
// never a form field.

import Link from "next/link";
import { getProjectUnits, getAttachableProperties, type AdminUnitRow } from "@/lib/admin/units/queries";
import {
   createProjectUnit,
   updateProjectUnit,
   setProjectUnitStatus,
   attachPropertyToProject,
   detachUnitFromProject,
   type UnitStatus,
} from "@/lib/admin/units/actions";

const STATUS_LABELS: Record<string, string> = {
   draft: "Draft (not public)",
   pending: "Pending review",
   published: "Available (public)",
   rejected: "Rejected",
   sold: "Sold",
   archived: "Archived",
};

const STATUS_ACTIONS: { status: UnitStatus; label: string; className: string }[] = [
   { status: "published", label: "Mark available", className: "btn-outline-success" },
   { status: "sold", label: "Mark sold", className: "btn-outline-warning" },
   { status: "draft", label: "Move to draft", className: "btn-outline-secondary" },
   { status: "archived", label: "Archive", className: "btn-outline-danger" },
];

const UnitRow = ({ projectId, unit }: { projectId: string; unit: AdminUnitRow }) => {
   const saveUnit = updateProjectUnit.bind(null, projectId, unit.id);

   const detach = async () => {
      "use server";
      await detachUnitFromProject(projectId, unit.id);
   };

   return (
      <form action={saveUnit} className="border rounded p-3 d-flex flex-column gap-2">
         <div className="d-flex justify-content-between align-items-center">
            <div className="fw-bold">{unit.title}</div>
            <span className="badge bg-secondary text-uppercase">{STATUS_LABELS[unit.status] ?? unit.status}</span>
         </div>

         <div className="row">
            <div className="col">
               <label className="form-label">Unit name / number *</label>
               <input name="title" defaultValue={unit.title} className="form-control" required minLength={3} />
            </div>
            <div className="col">
               <label className="form-label">Unit type</label>
               <input name="property_type" defaultValue={unit.property_type} className="form-control" placeholder="plot, villa, apartment" />
            </div>
            <div className="col">
               <label className="form-label">Listing type</label>
               <select name="listing_type" defaultValue={unit.listing_type} className="form-select">
                  <option value="sale">Sale</option>
                  <option value="rent">Rent</option>
               </select>
            </div>
         </div>

         <div className="row">
            <div className="col">
               <label className="form-label">Price *</label>
               <input name="price" type="number" step="0.01" defaultValue={unit.price} className="form-control" required />
            </div>
            <div className="col">
               <label className="form-label">Area</label>
               <input name="area" type="number" step="0.01" defaultValue={unit.area ?? ""} className="form-control" />
            </div>
            <div className="col">
               <label className="form-label">Area unit</label>
               <input name="area_unit" defaultValue={unit.area_unit ?? ""} className="form-control" placeholder="sqft, sqyd" />
            </div>
         </div>

         <div className="row">
            <div className="col">
               <label className="form-label">Bedrooms</label>
               <input name="bedrooms" type="number" defaultValue={unit.bedrooms ?? ""} className="form-control" />
            </div>
            <div className="col">
               <label className="form-label">Bathrooms</label>
               <input name="bathrooms" type="number" defaultValue={unit.bathrooms ?? ""} className="form-control" />
            </div>
            <div className="col">
               <label className="form-label">City</label>
               <input name="city" defaultValue={unit.city} className="form-control" />
            </div>
            <div className="col">
               <label className="form-label">Locality</label>
               <input name="locality" defaultValue={unit.locality} className="form-control" />
            </div>
         </div>

         <div>
            <label className="form-label">Description</label>
            <textarea name="description" defaultValue={unit.description ?? ""} className="form-control" rows={2} />
         </div>

         <div className="d-flex flex-wrap gap-2 align-items-center">
            <button type="submit" className="btn btn-primary btn-sm">
               Save unit
            </button>

            {STATUS_ACTIONS.filter((a) => a.status !== unit.status).map((action) => {
               const changeStatus = async () => {
                  "use server";
                  await setProjectUnitStatus(projectId, unit.id, action.status);
               };
               return (
                  <button key={action.status} type="submit" formAction={changeStatus} className={`btn ${action.className} btn-sm`}>
                     {action.label}
                  </button>
               );
            })}

            <button type="submit" formAction={detach} className="btn btn-outline-dark btn-sm">
               Detach from project
            </button>

            <Link href={`/properties/${unit.slug}`} className="btn btn-link btn-sm" target="_blank">
               View public page
            </Link>
         </div>
      </form>
   );
};

export default async function ProjectUnits({ projectId }: { projectId: string }) {
   const units = await getProjectUnits(projectId);
   const attachable = await getAttachableProperties();

   const addUnit = createProjectUnit.bind(null, projectId);
   const attach = attachPropertyToProject.bind(null, projectId);

   return (
      <div>
         <h5 className="mt-5 mb-3">Units / Plots</h5>
         <p className="text-muted small">
            A unit is an ordinary property record linked to this project, so it keeps its own detail page, media, and
            enquiries. Units never appear in the public Individual Properties listing — buyers reach them through this
            project. Only &quot;Available&quot; units are shown publicly.
         </p>

         {units.length > 0 ? (
            <div className="d-flex flex-column gap-4 mb-4">
               {units.map((unit) => (
                  <UnitRow key={unit.id} projectId={projectId} unit={unit} />
               ))}
            </div>
         ) : (
            <p className="text-muted small mb-4">No units yet.</p>
         )}

         <form action={addUnit} className="border rounded p-3 d-flex flex-column gap-2 mb-4">
            <h6 className="m-0">Add a unit</h6>
            <div className="row">
               <div className="col">
                  <label className="form-label">Unit name / number *</label>
                  <input name="title" className="form-control" required minLength={3} placeholder="e.g. Plot A-14" />
               </div>
               <div className="col">
                  <label className="form-label">Unit type *</label>
                  <input name="property_type" className="form-control" required placeholder="plot, villa, apartment" />
               </div>
               <div className="col">
                  <label className="form-label">Listing type</label>
                  <select name="listing_type" defaultValue="sale" className="form-select">
                     <option value="sale">Sale</option>
                     <option value="rent">Rent</option>
                  </select>
               </div>
            </div>

            <div className="row">
               <div className="col">
                  <label className="form-label">Price *</label>
                  <input name="price" type="number" step="0.01" className="form-control" required />
               </div>
               <div className="col">
                  <label className="form-label">Area</label>
                  <input name="area" type="number" step="0.01" className="form-control" />
               </div>
               <div className="col">
                  <label className="form-label">Area unit</label>
                  <input name="area_unit" defaultValue="sqft" className="form-control" />
               </div>
               <div className="col">
                  <label className="form-label">Availability</label>
                  <select name="status" defaultValue="draft" className="form-select">
                     <option value="draft">Draft (not public)</option>
                     <option value="published">Available (public)</option>
                     <option value="sold">Sold</option>
                  </select>
               </div>
            </div>

            <div className="row">
               <div className="col">
                  <label className="form-label">Bedrooms</label>
                  <input name="bedrooms" type="number" className="form-control" />
               </div>
               <div className="col">
                  <label className="form-label">Bathrooms</label>
                  <input name="bathrooms" type="number" className="form-control" />
               </div>
               <div className="col">
                  <label className="form-label">City *</label>
                  <input name="city" className="form-control" required />
               </div>
               <div className="col">
                  <label className="form-label">Locality *</label>
                  <input name="locality" className="form-control" required />
               </div>
            </div>

            <div>
               <label className="form-label">Description</label>
               <textarea name="description" className="form-control" rows={2} />
            </div>

            <div className="row">
               <div className="col">
                  <label className="form-label">Exact address</label>
                  <input name="exact_address" className="form-control" />
               </div>
               <div className="col">
                  <label className="form-label">Exact latitude</label>
                  <input name="exact_lat" type="number" step="0.000001" className="form-control" />
               </div>
               <div className="col">
                  <label className="form-label">Exact longitude</label>
                  <input name="exact_lng" type="number" step="0.000001" className="form-control" />
               </div>
            </div>
            <p className="text-muted small m-0">
               Address and coordinates are admin-only: buyers only ever see a randomised approximate marker until they
               qualify for a reveal. All three are required for the unit to get a public detail page.
            </p>

            <div>
               <button type="submit" className="btn btn-primary">
                  Add unit
               </button>
            </div>
         </form>

         <form action={attach} className="border rounded p-3 d-flex flex-column gap-2">
            <h6 className="m-0">Attach an existing property</h6>
            <p className="text-muted small m-0">
               Only properties that are not already part of a project are listed. Attaching does not change who owns the
               listing — it removes it from the public Individual Properties listing and shows it under this project
               instead.
            </p>
            {attachable.length > 0 ? (
               <>
                  <div>
                     <label className="form-label">Property</label>
                     <select name="property_id" className="form-select" required defaultValue="">
                        <option value="" disabled>
                           Choose a property…
                        </option>
                        {attachable.map((p) => (
                           <option key={p.id} value={p.id}>
                              {p.title} — {p.locality}, {p.city} ({p.status})
                           </option>
                        ))}
                     </select>
                  </div>
                  <div>
                     <button type="submit" className="btn btn-outline-primary">
                        Attach to this project
                     </button>
                  </div>
               </>
            ) : (
               <p className="text-muted small m-0">No unattached properties available.</p>
            )}
         </form>
      </div>
   );
}
