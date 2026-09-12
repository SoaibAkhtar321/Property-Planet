// src/lib/blog/queries.ts
//
// Public reads for /blog and /blog/[slug]. Reads only from `blog_public`
// (0010_blog_posts.sql) — never the base `blog_posts` table — so an
// unpublished/invalid slug simply returns no row here, exactly like
// getProjectBySlug/getPropertyBySlug. Callers should respond with
// notFound() in that case.

import { createClient } from "@/lib/supabase/server";

export interface BlogPublicRow {
   id: string;
   title: string;
   slug: string;
   excerpt: string | null;
   content: string;
   featured_image_path: string | null;
   category: string | null;
   seo_title: string | null;
   seo_description: string | null;
   og_image_path: string | null;
   reading_time_minutes: number | null;
   published_at: string | null;
}

export interface BlogPost {
   id: string;
   title: string;
   slug: string;
   excerpt: string | null;
   content: string;
   featuredImageUrl: string | null;
   ogImageUrl: string | null;
   category: string | null;
   seoTitle: string | null;
   seoDescription: string | null;
   readingTimeMinutes: number | null;
   publishedAt: string | null;
}

const BLOG_PUBLIC_COLUMNS =
   "id, title, slug, excerpt, content, featured_image_path, category, seo_title, seo_description, og_image_path, reading_time_minutes, published_at";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

function blogMediaPublicUrl(supabase: SupabaseClient, path: string | null): string | null {
   if (!path) return null;
   return supabase.storage.from("blog-media").getPublicUrl(path).data.publicUrl;
}

function mapPost(supabase: SupabaseClient, row: BlogPublicRow): BlogPost {
   const featuredImageUrl = blogMediaPublicUrl(supabase, row.featured_image_path);
   return {
      id: row.id,
      title: row.title,
      slug: row.slug,
      excerpt: row.excerpt,
      content: row.content,
      featuredImageUrl,
      // Falls back to the featured image when no dedicated OG image was set.
      ogImageUrl: blogMediaPublicUrl(supabase, row.og_image_path) ?? featuredImageUrl,
      category: row.category,
      seoTitle: row.seo_title,
      seoDescription: row.seo_description,
      readingTimeMinutes: row.reading_time_minutes,
      publishedAt: row.published_at,
   };
}

/** All published posts, newest first. Used by /blog. */
export async function getPublishedPosts(): Promise<BlogPost[]> {
   const supabase = await createClient();

   const { data, error } = await supabase
      .from("blog_public")
      .select(BLOG_PUBLIC_COLUMNS)
      .order("published_at", { ascending: false });

   if (error) {
      console.error("Failed to load blog posts:", error.message);
      return [];
   }

   return (data ?? []).map((row) => mapPost(supabase, row as BlogPublicRow));
}

/** A single published post by slug, or null if it doesn't exist / isn't published. */
export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
   const supabase = await createClient();

   const { data, error } = await supabase.from("blog_public").select(BLOG_PUBLIC_COLUMNS).eq("slug", slug).maybeSingle();

   if (error) {
      console.error("Failed to load blog post:", error.message);
      return null;
   }
   if (!data) return null;

   return mapPost(supabase, data as BlogPublicRow);
}

/** Up to `limit` other published posts, excluding the given post id. Used for a simple "more posts" list on the detail page. */
export async function getOtherPublishedPosts(excludeId: string, limit = 3): Promise<BlogPost[]> {
   const supabase = await createClient();

   const { data, error } = await supabase
      .from("blog_public")
      .select(BLOG_PUBLIC_COLUMNS)
      .neq("id", excludeId)
      .order("published_at", { ascending: false })
      .limit(limit);

   if (error) {
      console.error("Failed to load other blog posts:", error.message);
      return [];
   }

   return (data ?? []).map((row) => mapPost(supabase, row as BlogPublicRow));
}
