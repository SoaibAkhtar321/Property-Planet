import Link from "next/link";
import { createProject } from "@/lib/admin/projects/actions";

export default async function NewProjectPage({ searchParams }: { searchParams: { error?: string } }) {
   const error = searchParams?.error;

   return (
      <div style={{ maxWidth: 640 }}>
         <div className="mb-4">
            <Link href="/admin/projects">&larr; Back to projects</Link>
         </div>
         <h3 className="mb-4">New Project</h3>

         {error && <div className="alert alert-danger">{error}</div>}

         <form action={createProject} className="d-flex flex-column gap-3">
            <div>
               <label className="form-label">Title *</label>
               <input name="title" className="form-control" required minLength={3} />
            </div>
            <div>
               <label className="form-label">Slug (optional — derived from title if left blank)</label>
               <input name="slug" className="form-control" placeholder="e.g. property-planet" />
            </div>
            <div>
               <label className="form-label">Tag</label>
               <input name="tag" className="form-control" placeholder="e.g. Plotted Development" />
            </div>
            <div>
               <label className="form-label">Developer</label>
               <input name="developer" className="form-control" />
            </div>
            <div>
               <label className="form-label">Project type</label>
               <input name="project_type" className="form-control" />
            </div>
            <div className="row">
               <div className="col">
                  <label className="form-label">Total area</label>
                  <input name="total_area" type="number" step="0.01" className="form-control" />
               </div>
               <div className="col">
                  <label className="form-label">Area unit</label>
                  <input name="total_area_unit" className="form-control" placeholder="e.g. acre" />
               </div>
            </div>
            <div>
               <label className="form-label">Overview</label>
               <textarea name="overview" className="form-control" rows={4} />
            </div>
            <div>
               <button type="submit" className="btn btn-primary">
                  Create project (as draft)
               </button>
            </div>
         </form>
      </div>
   );
}
