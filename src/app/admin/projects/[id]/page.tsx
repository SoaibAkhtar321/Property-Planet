import Link from "next/link";
import { notFound } from "next/navigation";
import { getProjectForAdmin, getProjectPricing } from "@/lib/admin/projects/queries";
import {
   setProjectStatus,
   updateProjectBasics,
   updateProjectLocation,
   addProjectPricingRow,
   updateProjectPricingRow,
   deleteProjectPricingRow,
   type ProjectStatus,
} from "@/lib/admin/projects/actions";

export const dynamic = "force-dynamic";

export default async function EditProjectPage({ params }: { params: { id: string } }) {
   const result = await getProjectForAdmin(params.id);
   if (!result) notFound();
   const { project, location } = result;
   const pricingRows = await getProjectPricing(project.id);

   const updateBasics = updateProjectBasics.bind(null, project.id);
   const updateLocation = updateProjectLocation.bind(null, project.id);
   const addPricingRow = addProjectPricingRow.bind(null, project.id);

   const changeStatus = async (status: ProjectStatus) => {
      "use server";
      await setProjectStatus(project.id, status);
   };

   return (
      <div style={{ maxWidth: 720 }}>
         <div className="mb-4">
            <Link href="/admin/projects">&larr; Back to projects</Link>
         </div>

         <div className="d-flex justify-content-between align-items-center mb-4">
            <h3 className="m-0">{project.title}</h3>
            <span className="badge bg-secondary text-uppercase">{project.status}</span>
         </div>

         <div className="d-flex gap-2 mb-4">
            {project.status !== "published" && (
               <form action={async () => { "use server"; await changeStatus("published"); }}>
                  <button type="submit" className="btn btn-success btn-sm">
                     Publish
                  </button>
               </form>
            )}
            {project.status === "published" && (
               <form action={async () => { "use server"; await changeStatus("draft"); }}>
                  <button type="submit" className="btn btn-outline-secondary btn-sm">
                     Unpublish
                  </button>
               </form>
            )}
            {project.status !== "archived" && (
               <form action={async () => { "use server"; await changeStatus("archived"); }}>
                  <button type="submit" className="btn btn-outline-danger btn-sm">
                     Archive
                  </button>
               </form>
            )}
         </div>

         <h5 className="mt-5 mb-3">Project information</h5>
         <form action={updateBasics} className="d-flex flex-column gap-3">
            <div>
               <label className="form-label">Title *</label>
               <input name="title" defaultValue={project.title} className="form-control" required minLength={3} />
            </div>
            <div>
               <label className="form-label">Slug</label>
               <input name="slug" defaultValue={project.slug} className="form-control" />
            </div>
            <div>
               <label className="form-label">Tag</label>
               <input name="tag" defaultValue={project.tag ?? ""} className="form-control" />
            </div>
            <div>
               <label className="form-label">Developer</label>
               <input name="developer" defaultValue={project.developer ?? ""} className="form-control" />
            </div>
            <div>
               <label className="form-label">Project type</label>
               <input name="project_type" defaultValue={project.project_type ?? ""} className="form-control" />
            </div>
            <div className="row">
               <div className="col">
                  <label className="form-label">Total area</label>
                  <input
                     name="total_area"
                     type="number"
                     step="0.01"
                     defaultValue={project.total_area ?? ""}
                     className="form-control"
                  />
               </div>
               <div className="col">
                  <label className="form-label">Area unit</label>
                  <input name="total_area_unit" defaultValue={project.total_area_unit ?? ""} className="form-control" />
               </div>
            </div>
            <div>
               <label className="form-label">Overview</label>
               <textarea name="overview" defaultValue={project.overview ?? ""} className="form-control" rows={4} />
            </div>
            <div>
               <label className="form-label">SEO title</label>
               <input name="seo_title" defaultValue={project.seo_title ?? ""} className="form-control" />
            </div>
            <div>
               <label className="form-label">SEO description</label>
               <textarea name="seo_description" defaultValue={project.seo_description ?? ""} className="form-control" rows={2} />
            </div>
            <div className="form-check">
               <input type="checkbox" name="is_featured" defaultChecked={project.is_featured} className="form-check-input" id="is_featured" />
               <label className="form-check-label" htmlFor="is_featured">
                  Featured
               </label>
            </div>
            <div className="form-check">
               <input
                  type="checkbox"
                  name="is_new_arrival"
                  defaultChecked={project.is_new_arrival}
                  className="form-check-input"
                  id="is_new_arrival"
               />
               <label className="form-check-label" htmlFor="is_new_arrival">
                  New arrival
               </label>
            </div>
            <div>
               <label className="form-label">Display priority (lower shows first)</label>
               <input name="display_priority" type="number" defaultValue={project.display_priority} className="form-control" />
            </div>
            <div>
               <button type="submit" className="btn btn-primary">
                  Save project information
               </button>
            </div>
         </form>

         <h5 className="mt-5 mb-3">Location</h5>
         <form action={updateLocation} className="d-flex flex-column gap-3">
            <div>
               <label className="form-label">City</label>
               <input name="city" defaultValue={location?.city ?? ""} className="form-control" />
            </div>
            <div>
               <label className="form-label">Locality</label>
               <input name="locality" defaultValue={location?.locality ?? ""} className="form-control" />
            </div>
            <div>
               <label className="form-label">Address</label>
               <input name="address" defaultValue={location?.address ?? ""} className="form-control" />
            </div>
            <div className="row">
               <div className="col">
                  <label className="form-label">Latitude</label>
                  <input name="lat" type="number" step="0.000001" defaultValue={location?.lat ?? ""} className="form-control" />
               </div>
               <div className="col">
                  <label className="form-label">Longitude</label>
                  <input name="lng" type="number" step="0.000001" defaultValue={location?.lng ?? ""} className="form-control" />
               </div>
            </div>
            <div>
               <button type="submit" className="btn btn-primary">
                  Save location
               </button>
            </div>
         </form>

         <h5 className="mt-5 mb-3">Pricing</h5>
         <p className="text-muted small">
            Repeatable rows — add one per price point (e.g. &quot;Early-Bird Price&quot;, &quot;Official Price&quot;). Nothing here is
            pre-filled or guessed; only what you enter is shown publicly.
         </p>

         {pricingRows.length > 0 && (
            <div className="d-flex flex-column gap-4 mb-4">
               {pricingRows.map((row) => {
                  const updateRow = updateProjectPricingRow.bind(null, project.id, row.id);
                  const deleteRow = async () => {
                     "use server";
                     await deleteProjectPricingRow(project.id, row.id);
                  };
                  return (
                     <form key={row.id} action={updateRow} className="border rounded p-3 d-flex flex-column gap-2">
                        <div className="row">
                           <div className="col">
                              <label className="form-label">Label *</label>
                              <input name="label" defaultValue={row.label} className="form-control" required />
                           </div>
                           <div className="col">
                              <label className="form-label">Display order</label>
                              <input
                                 name="display_order"
                                 type="number"
                                 defaultValue={row.display_order}
                                 className="form-control"
                              />
                           </div>
                        </div>
                        <div className="row">
                           <div className="col">
                              <label className="form-label">Price</label>
                              <input
                                 name="price"
                                 type="number"
                                 step="0.01"
                                 defaultValue={row.price ?? ""}
                                 className="form-control"
                              />
                           </div>
                           <div className="col">
                              <label className="form-label">Price unit</label>
                              <input
                                 name="price_unit"
                                 defaultValue={row.price_unit ?? ""}
                                 placeholder="per_sqyd, per_acre, total"
                                 className="form-control"
                              />
                           </div>
                           <div className="col">
                              <label className="form-label">Currency</label>
                              <input name="currency" defaultValue={row.currency} className="form-control" />
                           </div>
                        </div>
                        <div>
                           <label className="form-label">Note</label>
                           <input
                              name="note"
                              defaultValue={row.note ?? ""}
                              placeholder="e.g. applicable conditions"
                              className="form-control"
                           />
                        </div>
                        <div className="d-flex gap-2">
                           <button type="submit" className="btn btn-primary btn-sm">
                              Save
                           </button>
                           <button type="submit" formAction={deleteRow} className="btn btn-outline-danger btn-sm">
                              Delete
                           </button>
                        </div>
                     </form>
                  );
               })}
            </div>
         )}

         <form action={addPricingRow} className="border rounded p-3 d-flex flex-column gap-2">
            <h6 className="m-0">Add a pricing row</h6>
            <div className="row">
               <div className="col">
                  <label className="form-label">Label *</label>
                  <input name="label" className="form-control" required placeholder="e.g. Early-Bird Price" />
               </div>
               <div className="col">
                  <label className="form-label">Display order</label>
                  <input name="display_order" type="number" defaultValue={0} className="form-control" />
               </div>
            </div>
            <div className="row">
               <div className="col">
                  <label className="form-label">Price</label>
                  <input name="price" type="number" step="0.01" className="form-control" />
               </div>
               <div className="col">
                  <label className="form-label">Price unit</label>
                  <input name="price_unit" placeholder="per_sqyd, per_acre, total" className="form-control" />
               </div>
               <div className="col">
                  <label className="form-label">Currency</label>
                  <input name="currency" defaultValue="INR" className="form-control" />
               </div>
            </div>
            <div>
               <label className="form-label">Note</label>
               <input name="note" placeholder="e.g. applicable conditions" className="form-control" />
            </div>
            <div>
               <button type="submit" className="btn btn-primary">
                  Add pricing row
               </button>
            </div>
         </form>

         <p className="text-muted small mt-5">
            Landmarks, connectivity, features, area distribution, and media (gallery / master plan / floor plan / video /
            documents) are not yet manageable here — left for a follow-up admin screen. Legal/compliance info (RERA,
            approvals) is intentionally not exposed in this admin UI yet either.
         </p>
      </div>
   );
}
