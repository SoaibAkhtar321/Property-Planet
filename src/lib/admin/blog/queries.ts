// src/lib/admin/blog/queries.ts
//
// Admin-only blog reads. Unlike src/lib/blog/queries.ts (which reads
// blog_public — published rows only, via anon-safe RLS), these functions
// read the base `blog_posts` table directly so an admin can see
// drafts/pending/archived posts too. Safe because:
//   * every call site is behind requireAdmin() (src/app/admin/**),
//   * the read still goes through createClient() (RLS-respecting, not a
//     service-role client) — "admins can read all posts" in
//     0010_blog_posts.sql is what actually authorizes the wider read.

import { createClient } from "@/lib/supabase/server";

export interface AdminBlogPostListRow {
   id: string;
   title: string;
   slug: string;
   category: string | null;
   status: "draft" | "pending" | "published" | "archived";
   published_at: string | null;
   updated_at: string;
}

export interface AdminBlogPostRow extends AdminBlogPostListRow {
   excerpt: string | null;
   content: string;
   featured_image_path: string | null;
   og_image_path: string | null;
   reading_time_minutes: number | null;
   seo_title: string | null;
   seo_description: string | null;
   created_at: string;
}

const ADMIN_BLOG_COLUMNS =
   "id, title, slug, excerpt, content, featured_image_path, og_image_path, category, status, reading_time_minutes, seo_title, seo_description, published_at, created_at, updated_at";

/** All posts regardless of status, for the /admin/blog list. */
export async function getAllPostsForAdmin(): Promise<AdminBlogPostListRow[]> {
   const supabase = await createClient();

   const { data, error } = await supabase
      .from("blog_posts")
      .select("id, title, slug, category, status, published_at, updated_at")
      .order("updated_at", { ascending: false });

   if (error) {
      console.error("Failed to load admin blog post list:", error.message);
      return [];
   }

   return (data ?? []) as AdminBlogPostListRow[];
}

/** A single post (any status), for the admin edit form. Null if not found. */
export async function getPostForAdmin(id: string): Promise<AdminBlogPostRow | null> {
   const supabase = await createClient();

   const { data, error } = await supabase.from("blog_posts").select(ADMIN_BLOG_COLUMNS).eq("id", id).maybeSingle();

   if (error) {
      console.error("Failed to load blog post for admin:", error.message);
      return null;
   }
   if (!data) return null;

   return data as AdminBlogPostRow;
}
