"use client";

// src/components/admin/blog/PostBasicsForm.tsx
//
// Phase 4H: updatePostBasics() already returns an ActionResult (success/
// error), but src/app/admin/blog/[id]/page.tsx used to call it as a bare
// `<form action={updateBasics}>` — the return value goes nowhere in that
// case, so a failed save (e.g. "That slug is already in use.") looked
// identical to a successful one. This wraps the same server action with
// the useTransition pattern already established in FeaturedImageUpload.tsx
// / ReraCertificateUpload.tsx so the result is actually surfaced. No
// fields, validation, or data flow changed — only feedback wiring.

import { useState, useTransition, type ReactNode } from "react";
import type { ActionResult } from "@/lib/admin/blog/actions";

const PostBasicsForm = ({
   action,
   children,
}: {
   action: (formData: FormData) => Promise<ActionResult>;
   children: ReactNode;
}) => {
   const [error, setError] = useState<string | null>(null);
   const [saved, setSaved] = useState(false);
   const [isPending, startTransition] = useTransition();

   const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      setError(null);
      setSaved(false);
      startTransition(async () => {
         const result = await action(formData);
         if (!result.success) {
            setError(result.error ?? "Could not save the post details. Please try again.");
            return;
         }
         setSaved(true);
      });
   };

   return (
      <form onSubmit={handleSubmit} className="d-flex flex-column gap-3">
         {error && (
            <div className="alert alert-danger mb-0" role="alert">
               {error}
            </div>
         )}
         {saved && !isPending && (
            <div className="alert alert-success mb-0" role="status">
               Post information saved.
            </div>
         )}
         {children}
         <div>
            <button type="submit" className="btn btn-primary" disabled={isPending}>
               {isPending ? "Saving..." : "Save post information"}
            </button>
         </div>
      </form>
   );
};

export default PostBasicsForm;
