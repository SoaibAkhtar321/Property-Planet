import { getSiteReraCertificate } from "@/lib/admin/settings/queries";
import { setSiteReraCertificate, updateSiteReraCertificateDetails, removeSiteReraCertificate } from "@/lib/admin/settings/actions";
import { createClient } from "@/lib/supabase/server";
import ReraCertificateUpload from "@/components/admin/settings/ReraCertificateUpload";
import ReraCertificateDetailsForm from "@/components/admin/settings/ReraCertificateDetailsForm";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
   const certificate = await getSiteReraCertificate();

   let publicUrl: string | null = null;
   if (certificate?.storage_path) {
      const supabase = await createClient();
      publicUrl = supabase.storage.from("project-media").getPublicUrl(certificate.storage_path).data.publicUrl;
   }

   const removeCertificate = async () => {
      "use server";
      await removeSiteReraCertificate();
   };

   return (
      <div style={{ maxWidth: 640 }}>
         <h3 className="mb-4">Site Settings</h3>

         <div className="border rounded p-4 mb-4">
            <h5 className="mb-1">RERA Certificate</h5>
            <p className="text-muted fs-14 mb-4">
               Shown publicly on the homepage as a trust/legal-verification badge. Only PDF, JPG, PNG, or WEBP, up to 25MB.
            </p>

            {certificate?.storage_path && publicUrl ? (
               <div className="d-flex flex-wrap align-items-center gap-3 mb-3">
                  <span className="badge bg-success">Certificate uploaded</span>
                  <a href={publicUrl} target="_blank" rel="noopener noreferrer">
                     View current file
                  </a>
                  <form action={removeCertificate}>
                     <button type="submit" className="btn btn-outline-danger btn-sm">
                        Remove
                     </button>
                  </form>
               </div>
            ) : (
               <div className="mb-3">
                  <span className="badge bg-secondary">No certificate uploaded</span>
               </div>
            )}

            <ReraCertificateUpload setCertificateAction={setSiteReraCertificate} />
            <p className="text-muted fs-14 mt-2 mb-0">Uploading replaces the current file, if any.</p>
         </div>

         <div className="border rounded p-4">
            <h5 className="mb-3">Supporting Text (optional)</h5>
            <ReraCertificateDetailsForm
               action={updateSiteReraCertificateDetails}
               defaultTitle={certificate?.title ?? ""}
               defaultDescription={certificate?.description ?? ""}
            />
         </div>
      </div>
   );
}
