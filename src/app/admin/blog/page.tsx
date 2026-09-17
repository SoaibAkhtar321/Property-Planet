import Link from "next/link";
import { getAllPostsForAdmin } from "@/lib/admin/blog/queries";
import { setPostStatus, type BlogPostStatus } from "@/lib/admin/blog/actions";

export const dynamic = "force-dynamic";

const statusBadgeClass: Record<string, string> = {
   draft: "bg-secondary",
   pending: "bg-warning text-dark",
   published: "bg-success",
   archived: "bg-dark",
};

// Bound server action so each row's <form> can call setPostStatus with its
// own post id without client-side JS. Same pattern as
// src/app/admin/projects/page.tsx's StatusForm.
function StatusForm({ id, status, label, variant }: { id: string; status: BlogPostStatus; label: string; variant: string }) {
   const action = async () => {
      "use server";
      await setPostStatus(id, status);
   };
   return (
      <form action={action} className="d-inline">
         <button type="submit" className={`btn btn-sm ${variant}`}>
            {label}
         </button>
      </form>
   );
}

export default async function AdminBlogPage() {
   const posts = await getAllPostsForAdmin();

   return (
      <div>
         <div className="d-flex justify-content-between align-items-center mb-4">
            <h3 className="m-0">Blog</h3>
            <Link href="/admin/blog/new" className="btn btn-primary">
               + New Post
            </Link>
         </div>

         {posts.length === 0 ? (
            <p className="text-muted">No posts yet.</p>
         ) : (
            <div className="table-responsive">
            <table className="table align-middle">
               <thead>
                  <tr>
                     <th>Title</th>
                     <th>Category</th>
                     <th>Status</th>
                     <th>Updated</th>
                     <th></th>
                  </tr>
               </thead>
               <tbody>
                  {posts.map((p) => (
                     <tr key={p.id}>
                        <td>
                           <Link href={`/admin/blog/${p.id}`}>{p.title}</Link>
                           <div className="text-muted small">/{p.slug}</div>
                        </td>
                        <td>{p.category ?? "—"}</td>
                        <td>
                           <span className={`badge ${statusBadgeClass[p.status] ?? "bg-secondary"}`}>{p.status}</span>
                        </td>
                        <td className="text-muted small">{new Date(p.updated_at).toLocaleDateString()}</td>
                        <td className="d-flex gap-2">
                           {p.status !== "published" && <StatusForm id={p.id} status="published" label="Publish" variant="btn-success" />}
                           {p.status === "published" && (
                              <StatusForm id={p.id} status="draft" label="Unpublish" variant="btn-outline-secondary" />
                           )}
                           {p.status !== "archived" && (
                              <StatusForm id={p.id} status="archived" label="Archive" variant="btn-outline-danger" />
                           )}
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
            </div>
         )}
      </div>
   );
}
