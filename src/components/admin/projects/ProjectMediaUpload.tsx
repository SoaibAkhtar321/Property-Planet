"use client";

// src/components/admin/projects/ProjectMediaUpload.tsx
//
// Client-side upload straight to the `project-media` Supabase Storage
// bucket, using the browser client — same established pattern as
// FeaturedImageUpload.tsx (blog) and PropertyMediaUpload.tsx (seller
// dashboard): the file bytes go directly from the browser to Storage,
// authorized by "admins can upload project media objects" (0006_projects.sql),
// and only the resulting storage_path is then handed to a server action
// (addProjectMediaRow) to persist as a project_media row. Never a
// service-role key here, and this component never talks to the
// project_media table directly — the server action is the only writer,
// so requireAdmin() there is a real second check, not just cosmetic.
//
// One instance of this component is rendered per media_type section
// (Master Plan, Gallery, Floor Plan, Documents, Video) on
// /admin/projects/[id], each bound to its own media_type and next
// sort_order — see page.tsx.

import { useCallback, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { ActionResult } from "@/lib/admin/projects/actions";

const MAX_FILE_BYTES = 25 * 1024 * 1024; // 25MB — generous enough for master-plan/floor-plan scans and PDFs

const ACCEPTED_TYPES_BY_MEDIA_TYPE: Record<string, string[]> = {
   gallery: ["image/jpeg", "image/png", "image/webp"],
   master_plan: ["image/jpeg", "image/png", "image/webp"],
   floor_plan: ["image/jpeg", "image/png", "image/webp"],
   document: ["application/pdf"],
   video: ["video/mp4", "video/webm"],
};

interface ProjectMediaUploadProps {
   projectId: string;
   mediaType: "gallery" | "master_plan" | "floor_plan" | "video" | "document";
   nextSortOrder: number;
   multiple?: boolean;
   addMediaAction: (formData: FormData) => Promise<ActionResult>;
}

const ProjectMediaUpload = ({ projectId, mediaType, nextSortOrder, multiple = false, addMediaAction }: ProjectMediaUploadProps) => {
   const [error, setError] = useState<string | null>(null);
   const [isPending, startTransition] = useTransition();
   const inputRef = useRef<HTMLInputElement>(null);
   const router = useRouter();

   const acceptedTypes = useMemo(() => ACCEPTED_TYPES_BY_MEDIA_TYPE[mediaType] ?? [], [mediaType]);

   const handleFiles = useCallback(
      (files: FileList | null) => {
         if (!files || files.length === 0) return;
         setError(null);

         startTransition(async () => {
            const supabase = createClient();
            let sortOrder = nextSortOrder;
            let anySucceeded = false;

            for (const file of Array.from(files)) {
               if (acceptedTypes.length > 0 && !acceptedTypes.includes(file.type)) {
                  setError(`${file.name}: unsupported file type for this section.`);
                  continue;
               }
               if (file.size > MAX_FILE_BYTES) {
                  setError(`${file.name}: file is larger than 25MB.`);
                  continue;
               }

               const ext = file.name.split(".").pop() ?? "bin";
               const path = `${projectId}/${crypto.randomUUID()}.${ext}`;

               const { error: uploadError } = await supabase.storage.from("project-media").upload(path, file);
               if (uploadError) {
                  setError(`${file.name}: ${uploadError.message}`);
                  continue;
               }

               const formData = new FormData();
               formData.set("storage_path", path);
               formData.set("media_type", mediaType);
               formData.set("sort_order", String(sortOrder));

               const result = await addMediaAction(formData);
               if (!result.success) {
                  // Storage upload succeeded but the DB row failed — the
                  // object is now an orphan in the bucket (no project_media
                  // row points at it). Not auto-cleaned up here so the
                  // admin sees a clear error rather than a silently
                  // vanished upload; a stray object with no row is
                  // harmless (never rendered by mapProject.ts, since that
                  // only reads project_media rows).
                  setError(`${file.name}: uploaded but failed to save (${result.error ?? "unknown error"}).`);
                  continue;
               }

               sortOrder += 1;
               anySucceeded = true;
            }

            if (anySucceeded) {
               router.refresh();
            }
         });

         if (inputRef.current) inputRef.current.value = "";
      },
      [projectId, mediaType, nextSortOrder, acceptedTypes, addMediaAction, router]
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
            {isPending ? "Uploading..." : "Upload file" + (multiple ? "(s)" : "")}
            <input
               ref={inputRef}
               type="file"
               accept={acceptedTypes.join(",")}
               multiple={multiple}
               disabled={isPending}
               onChange={(e) => handleFiles(e.target.files)}
            />
         </div>
      </div>
   );
};

export default ProjectMediaUpload;
