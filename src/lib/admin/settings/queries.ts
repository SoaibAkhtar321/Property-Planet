// src/lib/admin/settings/queries.ts
//
// Admin read for the single site-wide RERA certificate row (0014_site_rera_
// certificate.sql). Unlike src/lib/admin/projects/queries.ts there's no
// draft/published distinction to worry about — "site rera certificate is
// public" already allows anyone to select the row, so this read doesn't
// need to be admin-gated the way project drafts do. It's kept under
// lib/admin/settings anyway since the only caller is the admin page.

import { createClient } from "@/lib/supabase/server";

export interface SiteReraCertificateRow {
   storage_path: string | null;
   title: string | null;
   description: string | null;
   updated_at: string;
}

export async function getSiteReraCertificate(): Promise<SiteReraCertificateRow | null> {
   const supabase = await createClient();

   const { data, error } = await supabase
      .from("site_rera_certificate")
      .select("storage_path, title, description, updated_at")
      .eq("id", true)
      .maybeSingle();

   if (error) {
      console.error("Failed to load site_rera_certificate:", error.message);
      return null;
   }

   return data as SiteReraCertificateRow | null;
}
