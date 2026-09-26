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
// That policy is what actually stops a seller from touching another
// seller's media — this component trusts nothing it renders, only what
// Supabase's insert/upload calls succeed or fail with.

import { useCallback, useRef, useState, useTransition } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { OwnPropertyMediaRow } from "@/lib/properties/queries";
import { friendlyError } from "@/lib/errors";

const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_BYTES = 50 * 1024 * 1024; // 50MB — a short walkthrough clip
const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024; // 10MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const ACCEPTED_VIDEO_TYPES = ["video/mp4", "video/webm"];
const ACCEPTED_DOCUMENT_TYPES = ["application/pdf", "image/jpeg", "image/png"];
const ACCEPTED_TYPES = [...ACCEPTED_IMAGE_TYPES, ...ACCEPTED_VIDEO_TYPES];

const isVideo = (type: string) => ACCEPTED_VIDEO_TYPES.includes(type);

const documentFileName = (storagePath: string) => storagePath.split("/").pop() ?? storagePath;

const PropertyMediaUpload = ({ propertyId, initialMedia }: { propertyId: string; initialMedia: OwnPropertyMediaRow[] }) => {
   const [media, setMedia] = useState(initialMedia.filter((m) => m.media_type !== "document"));
   const [documents, setDocuments] = useState(initialMedia.filter((m) => m.media_type === "document"));
   const [error, setError] = useState<string | null>(null);
   const [docError, setDocError] = useState<string | null>(null);
   const [isPending, startTransition] = useTransition();
   const [isDocPending, startDocTransition] = useTransition();
   const inputRef = useRef<HTMLInputElement>(null);
   const docInputRef = useRef<HTMLInputElement>(null);

   const handleFiles = useCallback(
      (files: FileList | null) => {
         if (!files || files.length === 0) return;
         setError(null);

         startTransition(async () => {
            const supabase = createClient();
            // A local counter, not `media.length` re-read per file: several
            // files in the same batch upload sequentially below, and
            // `media` from the closure doesn't advance between them, which
            // would give every file in one batch the same sort_order.
            let sortOrder = media.length;

            for (const file of Array.from(files)) {
               if (!ACCEPTED_TYPES.includes(file.type)) {
                  setError(`${file.name}: only JPG, PNG, WEBP images or MP4/WEBM video are supported.`);
                  continue;
               }
               const maxBytes = isVideo(file.type) ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
               if (file.size > maxBytes) {
                  setError(`${file.name}: file is larger than ${Math.round(maxBytes / (1024 * 1024))}MB.`);
                  continue;
               }

               const mediaType = isVideo(file.type) ? "video" : "image";
               const ext = file.name.split(".").pop() ?? (mediaType === "video" ? "mp4" : "jpg");
               const path = `${propertyId}/${crypto.randomUUID()}.${ext}`;

               const { error: uploadError } = await supabase.storage.from("property-media").upload(path, file);
               if (uploadError) {
                  setError(`${file.name}: ${friendlyError(uploadError, "upload failed. Please try again.", "media.upload")}`);
                  continue;
               }

               const { data: row, error: insertError } = await supabase
                  .from("property_media")
                  .insert({ property_id: propertyId, storage_path: path, media_type: mediaType, sort_order: sortOrder })
                  .select("id, storage_path, media_type, sort_order")
                  .single();

               if (insertError || !row) {
                  // The object is already in storage at this point; leaving
                  // it unreferenced costs storage, not correctness — no
                  // property_media row means the UI never renders it, and a
                  // retry uploads a fresh path rather than colliding with
                  // this one.
                  setError(`${file.name}: uploaded but couldn't be saved. ${friendlyError(insertError, "Please try again.", "media.insert")}`);
                  continue;
               }

               sortOrder += 1;
               const publicUrl = supabase.storage.from("property-media").getPublicUrl(path).data.publicUrl;
               setMedia((prev) => [...prev, { ...row, publicUrl }]);
            }
         });

         if (inputRef.current) inputRef.current.value = "";
      },
      [propertyId, media.length]
   );

   const handleRemove = useCallback((item: OwnPropertyMediaRow) => {
      setError(null);
      startTransition(async () => {
         const supabase = createClient();

         const { error: deleteError } = await supabase.storage.from("property-media").remove([item.storage_path]);
         if (deleteError) {
            setError(friendlyError(deleteError, "Could not remove the file. Please try again.", "media.delete"));
            return;
         }

         const { error: rowError } = await supabase.from("property_media").delete().eq("id", item.id);
         if (rowError) {
            setError(friendlyError(rowError, "Could not remove the file. Please try again.", "media.row"));
            return;
         }

         setMedia((prev) => prev.filter((m) => m.id !== item.id));
      });
   }, []);

   // Verification documents — same upload mechanics as photos/video above
   // (direct-to-storage, then a property_media row with
   // media_type: "document"), kept as its own handler/state pair so a
   // failed or in-progress document upload never blocks or gets mixed up
   // with the photo/video list. These aren't shown on the public listing;
   // they exist purely for the admin moderation review (see
   // /admin/properties/[id] "Verification documents").
   const handleDocumentFiles = useCallback(
      (files: FileList | null) => {
         if (!files || files.length === 0) return;
         setDocError(null);

         startDocTransition(async () => {
            const supabase = createClient();
            let sortOrder = documents.length;

            for (const file of Array.from(files)) {
               if (!ACCEPTED_DOCUMENT_TYPES.includes(file.type)) {
                  setDocError(`${file.name}: only PDF, JPG or PNG files are supported for documents.`);
                  continue;
               }
               if (file.size > MAX_DOCUMENT_BYTES) {
                  setDocError(`${file.name}: file is larger than ${Math.round(MAX_DOCUMENT_BYTES / (1024 * 1024))}MB.`);
                  continue;
               }

               const ext = file.name.split(".").pop() ?? "pdf";
               const path = `${propertyId}/documents/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_")}`;

               const { error: uploadError } = await supabase.storage.from("property-media").upload(path, file);
               if (uploadError) {
                  setDocError(`${file.name}: ${friendlyError(uploadError, "upload failed. Please try again.", "media.doc.upload")}`);
                  continue;
               }

               const { data: row, error: insertError } = await supabase
                  .from("property_media")
                  .insert({ property_id: propertyId, storage_path: path, media_type: "document", sort_order: sortOrder })
                  .select("id, storage_path, media_type, sort_order")
                  .single();

               if (insertError || !row) {
                  setDocError(`${file.name}: uploaded but couldn't be saved. ${friendlyError(insertError, "Please try again.", "media.doc.insert")}`);
                  continue;
               }

               sortOrder += 1;
               const publicUrl = supabase.storage.from("property-media").getPublicUrl(path).data.publicUrl;
               setDocuments((prev) => [...prev, { ...row, publicUrl }]);
            }
         });

         if (docInputRef.current) docInputRef.current.value = "";
      },
      [propertyId, documents.length]
   );

   const handleRemoveDocument = useCallback((item: OwnPropertyMediaRow) => {
      setDocError(null);
      startDocTransition(async () => {
         const supabase = createClient();

         const { error: deleteError } = await supabase.storage.from("property-media").remove([item.storage_path]);
         if (deleteError) {
            setDocError(friendlyError(deleteError, "Could not remove the file. Please try again.", "media.doc.delete"));
            return;
         }

         const { error: rowError } = await supabase.from("property_media").delete().eq("id", item.id);
         if (rowError) {
            setDocError(friendlyError(rowError, "Could not remove the file. Please try again.", "media.doc.row"));
            return;
         }

         setDocuments((prev) => prev.filter((m) => m.id !== item.id));
      });
   }, []);

   return (
      <div className="bg-white card-box border-20 mt-40">
         <h4 className="dash-title-three">Photo &amp; Video Attachment</h4>
         <p className="fs-14 opacity-65 mb-20">
            Add clear photos of the property, and an optional walkthrough video. Buyers see these on the listing as
            soon as it&apos;s published.
         </p>

         {error && (
            <div className="alert alert-danger mb-20" role="alert">
               {error}
            </div>
         )}

         {media.length > 0 && (
            <div className="d-flex flex-wrap gap-3 mb-20" role="list" aria-label="Uploaded media">
               {media.map((item) => (
                  <div key={item.id} className="position-relative" role="listitem" style={{ width: 120, height: 90 }}>
                     {item.media_type === "video" ? (
                        <video
                           src={item.publicUrl}
                           muted
                           playsInline
                           style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 8 }}
                        />
                     ) : (
                        <Image
                           src={item.publicUrl}
                           alt="Uploaded property photo"
                           fill
                           style={{ objectFit: "cover", borderRadius: 8 }}
                           unoptimized
                        />
                     )}
                     <button
                        type="button"
                        className="remove-btn position-absolute top-0 end-0"
                        disabled={isPending}
                        onClick={() => handleRemove(item)}
                        aria-label={item.media_type === "video" ? "Remove video" : "Remove photo"}
                     >
                        <i className="bi bi-x" aria-hidden="true"></i>
                     </button>
                  </div>
               ))}
            </div>
         )}

         <div className="dash-btn-one d-inline-block position-relative me-3">
            <i className="bi bi-plus" aria-hidden="true"></i>
            {isPending ? "Uploading..." : "Upload File"}
            <input
               ref={inputRef}
               type="file"
               id="uploadPropertyMedia"
               name="uploadPropertyMedia"
               aria-label="Upload property photos or video"
               accept={ACCEPTED_TYPES.join(",")}
               multiple
               disabled={isPending}
               onChange={(e) => handleFiles(e.target.files)}
            />
         </div>
         <small>Photos: .jpg, .png, .webp up to 10MB each · Video: .mp4, .webm up to 50MB</small>

         <hr className="my-30" />

         <h4 className="dash-title-three">Verification Documents (optional)</h4>
         <p className="fs-14 opacity-65 mb-20">
            Upload ownership proof, tax receipts, or other documents that help our team verify this listing.
            These are private — only shown to Property Planet admins during review, never on the public listing.
         </p>

         {docError && (
            <div className="alert alert-danger mb-20" role="alert">
               {docError}
            </div>
         )}

         {documents.length > 0 && (
            <div className="d-flex flex-column gap-2 mb-20" role="list" aria-label="Uploaded verification documents">
               {documents.map((item) => (
                  <div key={item.id} className="d-flex align-items-center justify-content-between border rounded px-3 py-2" role="listitem">
                     <a href={item.publicUrl} target="_blank" rel="noreferrer" className="text-truncate" style={{ maxWidth: 320 }}>
                        <i className="bi bi-file-earmark-text me-2" aria-hidden="true"></i>
                        {documentFileName(item.storage_path).replace(/^[^-]*-/, "")}
                     </a>
                     <button
                        type="button"
                        className="btn btn-sm btn-outline-danger"
                        disabled={isDocPending}
                        onClick={() => handleRemoveDocument(item)}
                     >
                        Remove
                     </button>
                  </div>
               ))}
            </div>
         )}

         <div className="dash-btn-one d-inline-block position-relative me-3">
            <i className="bi bi-plus" aria-hidden="true"></i>
            {isDocPending ? "Uploading..." : "Upload Document"}
            <input
               ref={docInputRef}
               type="file"
               id="uploadPropertyDocuments"
               name="uploadPropertyDocuments"
               aria-label="Upload verification documents"
               accept={ACCEPTED_DOCUMENT_TYPES.join(",")}
               multiple
               disabled={isDocPending}
               onChange={(e) => handleDocumentFiles(e.target.files)}
            />
         </div>
         <small>PDF, JPG or PNG, up to 10MB each</small>
      </div>
   )
}

export default PropertyMediaUpload