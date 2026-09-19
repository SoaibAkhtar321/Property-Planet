"use client";

// Client-side upload straight to the `blog-media` Supabase Storage bucket,
// using the browser client — same established pattern as
// PropertyMediaUpload.tsx (direct RLS-authorized client calls; see
// 0010_blog_posts.sql for the storage policies, which require
// current_role_is('admin') for insert/delete on this bucket).
//
// A single featured image per post (not a gallery), so this stores the
// path directly on blog_posts.featured_image_path via setFeaturedImage()
// rather than a separate media table.

import { useCallback, useRef, useState, useTransition } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { setFeaturedImage } from "@/lib/admin/blog/actions";

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10MB
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

const FeaturedImageUpload = ({ postId, initialImageUrl }: { postId: string; initialImageUrl: string | null }) => {
   const [imageUrl, setImageUrl] = useState(initialImageUrl);
   const [error, setError] = useState<string | null>(null);
   const [isPending, startTransition] = useTransition();
   const inputRef = useRef<HTMLInputElement>(null);

   const handleFile = useCallback(
      (files: FileList | null) => {
         const file = files?.[0];
         if (!file) return;
         setError(null);

         if (!ACCEPTED_TYPES.includes(file.type)) {
            setError("Only JPG, PNG, or WEBP images are supported.");
            return;
         }
         if (file.size > MAX_FILE_BYTES) {
            setError("File is larger than 10MB.");
            return;
         }

         startTransition(async () => {
            const supabase = createClient();
            const ext = file.name.split(".").pop() ?? "jpg";
            const path = `${postId}/${crypto.randomUUID()}.${ext}`;

            const { error: uploadError } = await supabase.storage.from("blog-media").upload(path, file);
            if (uploadError) {
               setError(uploadError.message);
               return;
            }

            const result = await setFeaturedImage(postId, path);
            if (!result.success) {
               setError(result.error ?? "Uploaded but failed to save.");
               return;
            }

            setImageUrl(supabase.storage.from("blog-media").getPublicUrl(path).data.publicUrl);
         });

         if (inputRef.current) inputRef.current.value = "";
      },
      [postId]
   );

   return (
      <div className="bg-white card-box border-20 mt-40">
         <h4 className="dash-title-three">Featured Image</h4>

         {error && (
            <div className="alert alert-danger mb-15" role="alert">
               {error}
            </div>
         )}

         {imageUrl && (
            <div className="position-relative mb-20" style={{ width: 240, height: 160 }}>
               <Image src={imageUrl} alt="Featured image preview" fill style={{ objectFit: "cover", borderRadius: 8 }} unoptimized />
            </div>
         )}

         <div className="dash-btn-one d-inline-block position-relative">
            <i className="bi bi-plus"></i>
            {isPending ? "Uploading..." : imageUrl ? "Replace Image" : "Upload Image"}
            <input
               ref={inputRef}
               type="file"
               accept={ACCEPTED_TYPES.join(",")}
               disabled={isPending}
               onChange={(e) => handleFile(e.target.files)}
            />
         </div>
         <div>
            <small>Upload .jpg, .png, .webp — up to 10MB</small>
         </div>
      </div>
   );
};

export default FeaturedImageUpload;
