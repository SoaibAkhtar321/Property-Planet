"use client";

// src/components/admin/properties/AdminPropertyMediaUpload.tsx
//
// Same established split as ProjectMediaUpload.tsx: the browser uploads
// the file bytes directly to the `property-media` Storage bucket (the
// admin storage policies in 0018 authorize it), then hands only the
// resulting storage_path to a server action, which is the sole writer of
// the property_media row. No service-role key, no direct table write from
// the client.
//
// Path convention is the one 0005 established and property_media.storage_
// path records: {property_id}/{file}. The server action re-derives that
// prefix rather than trusting it.

import { useCallback, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { ActionResult } from "@/lib/admin/properties/actions";
import { friendlyError } from "@/lib/errors";

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10MB, matching the seller uploader
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

const AdminPropertyMediaUpload = ({
   propertyId,
   nextSortOrder,
   addMediaAction,
}: {
   propertyId: string;
   nextSortOrder: number;
   addMediaAction: (formData: FormData) => Promise<ActionResult>;
}) => {
   const [error, setError] = useState<string | null>(null);
   const [isPending, startTransition] = useTransition();
   const inputRef = useRef<HTMLInputElement>(null);
   const router = useRouter();

   const handleFiles = useCallback(
      (files: FileList | null) => {
         if (!files || files.length === 0) return;
         setError(null);

         startTransition(async () => {
            const supabase = createClient();
            let sortOrder = nextSortOrder;
            let anySucceeded = false;

            for (const file of Array.from(files)) {
               if (!ACCEPTED_TYPES.includes(file.type)) {
                  setError(`${file.name}: only JPG, PNG, or WEBP images are supported.`);
                  continue;
               }
               if (file.size > MAX_FILE_BYTES) {
                  setError(`${file.name}: file is larger than 10MB.`);
                  continue;
               }

               const ext = file.name.split(".").pop() ?? "jpg";
               const path = `${propertyId}/${crypto.randomUUID()}.${ext}`;

               const { error: uploadError } = await supabase.storage.from("property-media").upload(path, file);
               if (uploadError) {
                  setError(`${file.name}: ${friendlyError(uploadError, "upload failed. Please try again.", "admin.properties.mediaUpload")}`);
                  continue;
               }

               const formData = new FormData();
               formData.set("storage_path", path);
               formData.set("media_type", "image");
               formData.set("sort_order", String(sortOrder));

               const result = await addMediaAction(formData);
               if (!result.success) {
                  setError(result.error ?? `${file.name}: could not be attached.`);
                  continue;
               }

               sortOrder += 1;
               anySucceeded = true;
            }

            if (inputRef.current) inputRef.current.value = "";
            if (anySucceeded) router.refresh();
         });
      },
      [propertyId, nextSortOrder, addMediaAction, router]
   );

   return (
      <div>
         <input
            ref={inputRef}
            type="file"
            className="form-control"
            accept={ACCEPTED_TYPES.join(",")}
            multiple
            disabled={isPending}
            onChange={(e) => handleFiles(e.target.files)}
            aria-label="Upload property photos"
         />
         <div className="text-muted small mt-1">JPG, PNG or WEBP, up to 10MB each.</div>
         {isPending && <div className="text-muted small mt-1">Uploading…</div>}
         {error && <div className="alert alert-danger mt-2 mb-0 py-2">{error}</div>}
      </div>
   );
};

export default AdminPropertyMediaUpload;
