import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPostForAdmin } from "@/lib/admin/blog/queries";
import { setPostStatus, updatePostBasics, type BlogPostStatus } from "@/lib/admin/blog/actions";
import FeaturedImageUpload from "@/components/admin/blog/FeaturedImageUpload";

export const dynamic = "force-dynamic";

export default async function EditBlogPostPage({ params }: { params: { id: string } }) {
   const post = await getPostForAdmin(params.id);
   if (!post) notFound();

   const supabase = await createClient();
   const featuredImageUrl = post.featured_image_path
      ? supabase.storage.from("blog-media").getPublicUrl(post.featured_image_path).data.publicUrl
      : null;

   const updateBasics = updatePostBasics.bind(null, post.id);

   const changeStatus = async (status: BlogPostStatus) => {
      "use server";
      await setPostStatus(post.id, status);
   };

   return (
      <div style={{ maxWidth: 720 }}>
         <div className="mb-4">
            <Link href="/admin/blog">&larr; Back to blog</Link>
         </div>

         <div className="d-flex justify-content-between align-items-center mb-4">
            <h3 className="m-0">{post.title}</h3>
            <span className="badge bg-secondary text-uppercase">{post.status}</span>
         </div>

         <div className="d-flex gap-2 mb-4">
            {post.status !== "published" && (
               <form action={async () => { "use server"; await changeStatus("published"); }}>
                  <button type="submit" className="btn btn-success btn-sm">
                     Publish
                  </button>
               </form>
            )}
            {post.status === "published" && (
               <form action={async () => { "use server"; await changeStatus("draft"); }}>
                  <button type="submit" className="btn btn-outline-secondary btn-sm">
                     Unpublish
                  </button>
               </form>
            )}
            {post.status !== "archived" && (
               <form action={async () => { "use server"; await changeStatus("archived"); }}>
                  <button type="submit" className="btn btn-outline-danger btn-sm">
                     Archive
                  </button>
               </form>
            )}
         </div>

         <h5 className="mt-5 mb-3">Post information</h5>
         <form action={updateBasics} className="d-flex flex-column gap-3">
            <div>
               <label className="form-label">Title *</label>
               <input name="title" defaultValue={post.title} className="form-control" required minLength={3} />
            </div>
            <div>
               <label className="form-label">Slug</label>
               <input name="slug" defaultValue={post.slug} className="form-control" />
            </div>
            <div>
               <label className="form-label">Category</label>
               <input name="category" defaultValue={post.category ?? ""} className="form-control" />
            </div>
            <div>
               <label className="form-label">Excerpt</label>
               <textarea name="excerpt" defaultValue={post.excerpt ?? ""} className="form-control" rows={2} />
            </div>
            <div>
               <label className="form-label">Content</label>
               <textarea name="content" defaultValue={post.content} className="form-control" rows={12} />
            </div>
            <div>
               <label className="form-label">Reading time (minutes)</label>
               <input
                  name="reading_time_minutes"
                  type="number"
                  min={1}
                  defaultValue={post.reading_time_minutes ?? ""}
                  className="form-control"
               />
            </div>
            <div>
               <label className="form-label">SEO title</label>
               <input name="seo_title" defaultValue={post.seo_title ?? ""} className="form-control" />
            </div>
            <div>
               <label className="form-label">SEO description</label>
               <textarea name="seo_description" defaultValue={post.seo_description ?? ""} className="form-control" rows={2} />
            </div>
            <div>
               <button type="submit" className="btn btn-primary">
                  Save post information
               </button>
            </div>
         </form>

         <FeaturedImageUpload postId={post.id} initialImageUrl={featuredImageUrl} />

         <p className="text-muted small mt-5">
            The Open Graph image falls back to the featured image automatically when no separate OG image is set — there is no
            separate OG image upload UI yet in this phase.
         </p>
      </div>
   );
}
