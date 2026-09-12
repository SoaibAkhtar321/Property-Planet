"use server";

// src/lib/admin/blog/actions.ts
//
// Server actions backing the /admin/blog UI. Each action independently
// calls requireAdmin() — see src/lib/admin/auth.ts's comment for why this
// isn't redundant with src/middleware.ts: server actions are directly
// callable endpoints the middleware matcher does not cover on its own.
//
// Writes go through src/lib/supabase/server.ts's createClient() (the
// RLS-respecting, cookie/session-based client), never a service-role
// client. Authorization for the actual write is enforced by the
// "admins can insert/update posts" RLS policies in 0010_blog_posts.sql —
// requireAdmin() here is the app-level check in front of that
// database-level backstop, not a replacement for it.

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import { createClient } from "@/lib/supabase/server";

export type BlogPostStatus = "draft" | "pending" | "published" | "archived";

export interface ActionResult {
   success: boolean;
   error?: string;
}

const slugify = (value: string) =>
   value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

const numberOrNull = (value: FormDataEntryValue | null) => {
   if (!value || String(value).trim() === "") return null;
   const n = Number(value);
   return Number.isFinite(n) ? n : null;
};

const textOrNull = (value: FormDataEntryValue | null) => {
   const s = value ? String(value).trim() : "";
   return s === "" ? null : s;
};

/** Creates a post in `draft` status, then redirects to its edit page. */
export async function createPost(formData: FormData): Promise<void> {
   await requireAdmin();
   const supabase = await createClient();

   const title = String(formData.get("title") ?? "").trim();
   if (title.length < 3) {
      redirect("/admin/blog/new?error=" + encodeURIComponent("Title must be at least 3 characters."));
   }

   const requestedSlug = textOrNull(formData.get("slug"));
   const slug = requestedSlug ? slugify(requestedSlug) : slugify(title);

   const {
      data: { user },
   } = await supabase.auth.getUser();

   const { data, error } = await supabase
      .from("blog_posts")
      .insert({
         title,
         slug,
         excerpt: textOrNull(formData.get("excerpt")),
         content: String(formData.get("content") ?? ""),
         category: textOrNull(formData.get("category")),
         created_by: user?.id ?? null,
      })
      .select("id")
      .single();

   if (error || !data) {
      const message = error?.code === "23505" ? "That slug is already in use." : error?.message ?? "Failed to create post.";
      redirect("/admin/blog/new?error=" + encodeURIComponent(message));
   }

   revalidatePath("/admin/blog");
   redirect(`/admin/blog/${data.id}`);
}

/** Updates the core post fields (not status, not media). */
export async function updatePostBasics(id: string, formData: FormData): Promise<ActionResult> {
   await requireAdmin();
   const supabase = await createClient();

   const title = String(formData.get("title") ?? "").trim();
   if (title.length < 3) {
      return { success: false, error: "Title must be at least 3 characters." };
   }

   const requestedSlug = textOrNull(formData.get("slug"));
   const slug = requestedSlug ? slugify(requestedSlug) : undefined;

   const { error } = await supabase
      .from("blog_posts")
      .update({
         title,
         ...(slug ? { slug } : {}),
         excerpt: textOrNull(formData.get("excerpt")),
         content: String(formData.get("content") ?? ""),
         category: textOrNull(formData.get("category")),
         reading_time_minutes: numberOrNull(formData.get("reading_time_minutes")),
         seo_title: textOrNull(formData.get("seo_title")),
         seo_description: textOrNull(formData.get("seo_description")),
      })
      .eq("id", id);

   if (error) {
      return { success: false, error: error.code === "23505" ? "That slug is already in use." : error.message };
   }

   revalidatePath("/admin/blog");
   revalidatePath(`/admin/blog/${id}`);
   revalidatePath("/blog");
   return { success: true };
}

/**
 * Changes a post's status — this is how publish/unpublish/archive is done.
 * No separate delete action exists: matches the properties/projects
 * convention of retiring content via status, not row deletion, and
 * `blog_posts` (0010) has no delete RLS policy at all.
 */
export async function setPostStatus(id: string, status: BlogPostStatus): Promise<ActionResult> {
   await requireAdmin();
   const supabase = await createClient();

   const { error } = await supabase.from("blog_posts").update({ status }).eq("id", id);

   if (error) {
      return { success: false, error: error.message };
   }

   revalidatePath("/admin/blog");
   revalidatePath(`/admin/blog/${id}`);
   revalidatePath("/blog");
   return { success: true };
}

/** Records the storage path of an uploaded featured image (upload itself happens client-side, same pattern as PropertyMediaUpload). */
export async function setFeaturedImage(id: string, storagePath: string): Promise<ActionResult> {
   await requireAdmin();
   const supabase = await createClient();

   const { error } = await supabase.from("blog_posts").update({ featured_image_path: storagePath }).eq("id", id);

   if (error) {
      return { success: false, error: error.message };
   }

   revalidatePath(`/admin/blog/${id}`);
   revalidatePath("/admin/blog");
   revalidatePath("/blog");
   return { success: true };
}
