"use client"

// Client-side upload straight to the `property-media` Supabase Storage
// bucket, using the browser client — same established pattern as
// ProfileBody.tsx (direct RLS-authorized client calls, not a server
// action, since these are simple owner-scoped writes and RLS is the real
// authorization boundary either way; see 0005_admin_rpc_and_storage.sql
// for the storage policies and 0002 for the property_media table policies).
//
// Path convention required by "sellers can upload media for own
// properties" (0005): the property id must be the first path segment, so
// a seller can only ever write into folders under properties they own.

import { useCallback, useRef, useState, useTransition } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { OwnPropertyMediaRow } from "@/lib/properties/queries";

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10MB
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

const PropertyMediaUpload = ({ propertyId, initialMedia }: { propertyId: string; initialMedia: OwnPropertyMediaRow[] }) => {
   const [media, setMedia] = useState(initialMedia);
   const [error, setError] = useState<string | null>(null);
   const [isPending, startTransition] = useTransition();
   const inputRef = useRef<HTMLInputElement>(null);

   const handleFiles = useCallback((files: FileList | null) => {
      if (!files || files.length === 0) return;
      setError(null);

      startTransition(async () => {
         const supabase = createClient();

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
               setError(`${file.name}: ${uploadError.message}`);
               continue;
            }

            const { data: row, error: insertError } = await supabase
               .from("property_media")
               .insert({ property_id: propertyId, storage_path: path, media_type: "image", sort_order: media.length })
               .select("id, storage_path, media_type, sort_order")
               .single();

            if (insertError || !row) {
               setError(`${file.name}: uploaded but failed to save (${insertError?.message ?? "unknown error"}).`);
               continue;
            }

            const publicUrl = supabase.storage.from("property-media").getPublicUrl(path).data.publicUrl;
            setMedia((prev) => [...prev, { ...row, publicUrl }]);
         }
      });

      if (inputRef.current) inputRef.current.value = "";
   }, [propertyId, media.length]);

   const handleRemove = useCallback((item: OwnPropertyMediaRow) => {
      setError(null);
      startTransition(async () => {
         const supabase = createClient();

         const { error: deleteError } = await supabase.storage.from("property-media").remove([item.storage_path]);
         if (deleteError) {
            setError(deleteError.message);
            return;
         }

         const { error: rowError } = await supabase.from("property_media").delete().eq("id", item.id);
         if (rowError) {
            setError(rowError.message);
            return;
         }

         setMedia((prev) => prev.filter((m) => m.id !== item.id));
      });
   }, []);

   return (
      <div className="bg-white card-box border-20 mt-40">
         <h4 className="dash-title-three">Photo & Video Attachment</h4>

         {error && <div className="alert alert-danger mb-15" role="alert">{error}</div>}

         {media.length > 0 && (
            <div className="d-flex flex-wrap gap-3 mb-20">
               {media.map((item) => (
                  <div key={item.id} className="position-relative" style={{ width: 120, height: 90 }}>
                     <Image src={item.publicUrl} alt="" fill style={{ objectFit: "cover", borderRadius: 8 }} unoptimized />
                     <button
                        type="button"
                        className="remove-btn position-absolute top-0 end-0"
                        disabled={isPending}
                        onClick={() => handleRemove(item)}
                     >
                        <i className="bi bi-x"></i>
                     </button>
                  </div>
               ))}
            </div>
         )}

         <div className="dash-btn-one d-inline-block position-relative me-3">
            <i className="bi bi-plus"></i>
            {isPending ? "Uploading..." : "Upload File"}
            <input
               ref={inputRef}
               type="file"
               id="uploadPropertyMedia"
               name="uploadPropertyMedia"
               accept={ACCEPTED_TYPES.join(",")}
               multiple
               disabled={isPending}
               onChange={(e) => handleFiles(e.target.files)}
            />
         </div>
         <small>Upload file .jpg, .png, .webp — up to 10MB each</small>
      </div>
   )
}

export default PropertyMediaUpload
