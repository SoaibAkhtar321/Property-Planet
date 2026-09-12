import Link from "next/link";
import { createPost } from "@/lib/admin/blog/actions";

export default async function NewBlogPostPage({ searchParams }: { searchParams: { error?: string } }) {
   const error = searchParams?.error;

   return (
      <div style={{ maxWidth: 640 }}>
         <div className="mb-4">
            <Link href="/admin/blog">&larr; Back to blog</Link>
         </div>
         <h3 className="mb-4">New Post</h3>

         {error && <div className="alert alert-danger">{error}</div>}

         <form action={createPost} className="d-flex flex-column gap-3">
            <div>
               <label className="form-label">Title *</label>
               <input name="title" className="form-control" required minLength={3} />
            </div>
            <div>
               <label className="form-label">Slug (optional — derived from title if left blank)</label>
               <input name="slug" className="form-control" placeholder="e.g. how-to-buy-a-plot-in-hyderabad" />
            </div>
            <div>
               <label className="form-label">Category</label>
               <input name="category" className="form-control" placeholder="e.g. Buying Guide, Documentation, Location Research" />
            </div>
            <div>
               <label className="form-label">Excerpt</label>
               <textarea name="excerpt" className="form-control" rows={2} />
            </div>
            <div>
               <label className="form-label">Content</label>
               <textarea name="content" className="form-control" rows={10} />
            </div>
            <div>
               <button type="submit" className="btn btn-primary">
                  Create post (as draft)
               </button>
            </div>
         </form>
      </div>
   );
}
