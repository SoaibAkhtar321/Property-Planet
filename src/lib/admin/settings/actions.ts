"use server";

// src/lib/admin/settings/actions.ts
//
// Server actions backing /admin/settings' RERA certificate section. Same
// shape as addProjectMediaRow / deleteProjectMediaRow in
// src/lib/admin/projects/actions.ts: the browser uploads the file bytes
// straight to Storage (see ReraCertificateUpload.tsx), then this action
// persists/clears storage_path on the single site_rera_certificate row.
// requireAdmin() here is the app-level check in front of the
// "admins can update site rera certificate" RLS policy (0014_site_rera_
// certificate.sql), not a replacement for it.

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";
import { createClient } from "@/lib/supabase/server";
import { friendlyError } from "@/lib/errors";

export interface ActionResult {
   success: boolean;
   error?: string;
}

const textOrNull = (value: FormDataEntryValue | null) => {
   const s = value ? String(value).trim() : "";
   return s === "" ? null : s;
};

/** Saves an already-uploaded storage_path as the current certificate, replacing any previous one's file. */
export async function setSiteReraCertificate(formData: FormData): Promise<ActionResult> {
   await requireAdmin();
   const supabase = await createClient();

   const storagePath = textOrNull(formData.get("storage_path"));
   if (!storagePath) {
      return { success: false, error: "No uploaded file to save." };
   }

   const { data: existing, error: fetchError } = await supabase
      .from("site_rera_certificate")
      .select("storage_path")
      .eq("id", true)
      .maybeSingle();

   if (fetchError) {
      return { success: false, error: friendlyError(fetchError, "Could not load the current certificate. Please try again.", "admin.settings.setSiteReraCertificate") };
   }

   const { error } = await supabase
      .from("site_rera_certificate")
      .update({ storage_path: storagePath })
      .eq("id", true);

   if (error) {
      return { success: false, error: friendlyError(error, "Could not save the certificate. Please try again.", "admin.settings.setSiteReraCertificate") };
   }

   // Best-effort cleanup of the previous file now that the row points at
   // the new one. Not fatal if it fails — a stray old object in Storage is
   // harmless (nothing reads it once storage_path no longer points at it).
   if (existing?.storage_path && existing.storage_path !== storagePath) {
      const { error: removeError } = await supabase.storage.from("project-media").remove([existing.storage_path]);
      if (removeError) {
         console.error("Failed to remove previous site RERA certificate file:", removeError.message);
      }
   }

   revalidatePath("/admin/settings");
   revalidatePath("/");
   return { success: true };
}

/** Updates the optional supporting title/description text (no file involved). */
export async function updateSiteReraCertificateDetails(formData: FormData): Promise<ActionResult> {
   await requireAdmin();
   const supabase = await createClient();

   const { error } = await supabase
      .from("site_rera_certificate")
      .update({
         title: textOrNull(formData.get("title")),
         description: textOrNull(formData.get("description")),
      })
      .eq("id", true);

   if (error) {
      return { success: false, error: friendlyError(error, "Could not update the certificate details. Please try again.", "admin.settings.updateSiteReraCertificateDetails") };
   }

   revalidatePath("/admin/settings");
   revalidatePath("/");
   return { success: true };
}

/** Clears the certificate: removes the Storage object and nulls storage_path. Title/description are left as-is. */
export async function removeSiteReraCertificate(): Promise<ActionResult> {
   await requireAdmin();
   const supabase = await createClient();

   const { data: existing, error: fetchError } = await supabase
      .from("site_rera_certificate")
      .select("storage_path")
      .eq("id", true)
      .maybeSingle();

   if (fetchError) {
      return { success: false, error: friendlyError(fetchError, "Could not load the current certificate. Please try again.", "admin.settings.removeSiteReraCertificate") };
   }
   if (!existing?.storage_path) {
      return { success: false, error: "No certificate currently uploaded." };
   }

   const { error: storageError } = await supabase.storage.from("project-media").remove([existing.storage_path]);
   if (storageError) {
      return { success: false, error: friendlyError(storageError, "Could not delete the certificate file from storage. Please try again.", "admin.settings.removeSiteReraCertificate") };
   }

   const { error } = await supabase.from("site_rera_certificate").update({ storage_path: null }).eq("id", true);
   if (error) {
      return { success: false, error: friendlyError(error, "Could not remove the certificate. Please try again.", "admin.settings.removeSiteReraCertificate") };
   }

   revalidatePath("/admin/settings");
   revalidatePath("/");
   return { success: true };
}
