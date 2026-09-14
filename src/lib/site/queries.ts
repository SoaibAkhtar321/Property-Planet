// src/lib/site/queries.ts
//
// Public (anon-safe) read of the single site_rera_certificate row —
// "site rera certificate is public" policy (0014_site_rera_certificate.sql)
// allows anyone to select it, same as project_public. Returns null when no
// file has been uploaded yet, or the row doesn't resolve to a usable public
// URL, so callers can render nothing rather than a broken trust badge.

import { createClient } from "@/lib/supabase/server";

export interface SiteReraCertificate {
   url: string;
   title: string | null;
   description: string | null;
}

export async function getPublicSiteReraCertificate(): Promise<SiteReraCertificate | null> {
   const supabase = await createClient();

   const { data, error } = await supabase
      .from("site_rera_certificate")
      .select("storage_path, title, description")
      .eq("id", true)
      .maybeSingle();

   if (error) {
      console.error("Failed to load site_rera_certificate:", error.message);
      return null;
   }
   if (!data?.storage_path) return null;

   const { data: urlData } = supabase.storage.from("project-media").getPublicUrl(data.storage_path);

   return { url: urlData.publicUrl, title: data.title, description: data.description };
}
