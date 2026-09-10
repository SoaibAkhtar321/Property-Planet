import Link from "next/link";
import { getAllProjectsForAdmin } from "@/lib/admin/projects/queries";
import { setProjectStatus, type ProjectStatus } from "@/lib/admin/projects/actions";

export const dynamic = "force-dynamic";

const statusBadgeClass: Record<string, string> = {
   draft: "bg-secondary",
   pending: "bg-warning text-dark",
   published: "bg-success",
   archived: "bg-dark",
};

// Bound server action so each row's <form> can call setProjectStatus with
// its own project id without client-side JS.
function StatusForm({ id, status, label, variant }: { id: string; status: ProjectStatus; label: string; variant: string }) {
   const action = async () => {
      "use server";
      await setProjectStatus(id, status);
   };
   return (
      <form action={action} className="d-inline">
         <button type="submit" className={`btn btn-sm ${variant}`}>
            {label}
         </button>
      </form>
   );
}

export default async function AdminProjectsPage() {
   const projects = await getAllProjectsForAdmin();

   return (
      <div>
         <div className="d-flex justify-content-between align-items-center mb-4">
            <h3 className="m-0">Projects</h3>
            <Link href="/admin/projects/new" className="btn btn-primary">
               + New Project
            </Link>
         </div>

         {projects.length === 0 ? (
            <p className="text-muted">No projects yet.</p>
         ) : (
            <table className="table align-middle">
               <thead>
                  <tr>
                     <th>Title</th>
                     <th>Status</th>
                     <th>Featured</th>
                     <th>New</th>
                     <th>Priority</th>
                     <th>Updated</th>
                     <th></th>
                  </tr>
               </thead>
               <tbody>
                  {projects.map((p) => (
                     <tr key={p.id}>
                        <td>
                           <Link href={`/admin/projects/${p.id}`}>{p.title}</Link>
                           <div className="text-muted small">/{p.slug}</div>
                        </td>
                        <td>
                           <span className={`badge ${statusBadgeClass[p.status] ?? "bg-secondary"}`}>{p.status}</span>
                        </td>
                        <td>{p.is_featured ? "Yes" : "—"}</td>
                        <td>{p.is_new_arrival ? "Yes" : "—"}</td>
                        <td>{p.display_priority}</td>
                        <td className="text-muted small">{new Date(p.updated_at).toLocaleDateString()}</td>
                        <td className="d-flex gap-2">
                           {p.status !== "published" && <StatusForm id={p.id} status="published" label="Publish" variant="btn-success" />}
                           {p.status === "published" && <StatusForm id={p.id} status="draft" label="Unpublish" variant="btn-outline-secondary" />}
                           {p.status !== "archived" && <StatusForm id={p.id} status="archived" label="Archive" variant="btn-outline-danger" />}
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
         )}
      </div>
   );
}
