"use client";

// src/components/admin/settings/ReraCertificateUpload.tsx
//
// Same client-straight-to-Storage pattern as
// src/components/admin/projects/ProjectMediaUpload.tsx, reusing the
// existing `project-media` bucket (public read / admin-only insert-delete,
// see 0006_projects.sql) rather than a new bucket. Written under a `site/`
// prefix so it never collides with a {projectId}/... path. Single file,
// always replaces whatever is current — setSiteReraCertificate() is the
// only writer of site_rera_certificate.storage_path, so requireAdmin()
// there is a real second check, not just cosmetic.

import { useCallback, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { ActionResult } from "@/lib/admin/settings/actions";
import { friendlyError } from "@/lib/errors";

const MAX_FILE_BYTES = 25 * 1024 * 1024; // 25MB — matches ProjectMediaUpload's document limit
const ACCEPTED_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp"];

interface ReraCertificateUploadProps {
   setCertificateAction: (formData: FormData) => Promise<ActionResult>;
}

const ReraCertificateUpload = ({ setCertificateAction }: ReraCertificateUploadProps) => {
   const [error, setError] = useState<string | null>(null);
   const [isPending, startTransition] = useTransition();
   const inputRef = useRef<HTMLInputElement>(null);
   const router = useRouter();

   const handleFile = useCallback(
      (files: FileList | null) => {
         const file = files?.[0];
         if (!file) return;
         setError(null);

         if (!ACCEPTED_TYPES.includes(file.type)) {
            setError(`${file.name}: unsupported file type. Use PDF, JPG, PNG, or WEBP.`);
            if (inputRef.current) inputRef.current.value = "";
            return;
         }
         if (file.size > MAX_FILE_BYTES) {
            setError(`${file.name}: file is larger than 25MB.`);
            if (inputRef.current) inputRef.current.value = "";
            return;
         }

         startTransition(async () => {
            const supabase = createClient();
            const ext = file.name.split(".").pop() ?? "bin";
            const path = `site/${crypto.randomUUID()}.${ext}`;

            const { error: uploadError } = await supabase.storage.from("project-media").upload(path, file);
            if (uploadError) {
               setError(`${file.name}: ${friendlyError(uploadError, "upload failed. Please try again.", "admin.settings.certificateUpload")}`);
               if (inputRef.current) inputRef.current.value = "";
               return;
            }

            const formData = new FormData();
            formData.set("storage_path", path);

            const result = await setCertificateAction(formData);
            if (!result.success) {
               // Storage upload succeeded but the row update failed — the
               // object is now an orphan in the bucket. Not auto-cleaned up
               // here so the admin sees a clear error rather than a
               // silently vanished upload; a stray object nothing points
               // at is harmless.
               setError(`${file.name}: uploaded but failed to save (${result.error ?? "unknown error"}).`);
            } else {
               router.refresh();
            }

            if (inputRef.current) inputRef.current.value = "";
         });
      },
      [setCertificateAction, router]
   );

   return (
      <div>
         {error && (
            <div className="alert alert-danger mb-2 py-2 px-3" role="alert">
               {error}
            </div>
         )}
         <div className="dash-btn-one d-inline-block position-relative">
            <i className="bi bi-plus"></i>
            {isPending ? "Uploading..." : "Upload certificate"}
            <input
               ref={inputRef}
               type="file"
               accept={ACCEPTED_TYPES.join(",")}
               disabled={isPending}
               onChange={(e) => handleFile(e.target.files)}
            />
         </div>
      </div>
   );
};

export default ReraCertificateUpload;
