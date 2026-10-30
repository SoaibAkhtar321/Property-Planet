import type { SupabaseClient } from "@supabase/supabase-js";

const slugify = (value: string) =>
   value
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 70)
      .replace(/-+$/g, "");

/**
 * Listings start life with a throwaway `draft-xxxx` slug (they need an id
 * before the form is filled so media can upload against it). Once the
 * real title is saved, give the listing a readable, SEO-friendly URL such
 * as /properties/open-plot-shadnagar-3f9a1c. Only replaces `draft-` slugs,
 * so a live listing's URL never changes underneath existing links.
 * Best-effort: a failure here never fails the save itself.
 */
export async function finalizeDraftSlug(
   supabase: SupabaseClient,
   id: string,
   title: string,
   locality: string | null,
): Promise<void> {
   const { data } = await supabase.from("properties").select("slug").eq("id", id).maybeSingle();
   if (!data?.slug?.startsWith("draft-")) return;
   const base = slugify(`${title} ${locality ?? ""}`) || "property";
   const slug = `${base}-${id.replace(/-/g, "").slice(0, 6)}`;
   await supabase.from("properties").update({ slug }).eq("id", id).like("slug", "draft-%");
}
