"use client";

// src/components/admin/settings/ReraCertificateDetailsForm.tsx
//
// Phase 4H: updateSiteReraCertificateDetails() already returns an
// ActionResult, but src/app/admin/settings/page.tsx used to call it as a
// bare `<form action={...}>`, so the result was discarded and a failed
// save looked identical to a successful one. This wraps the same server
// action with the useTransition pattern already established in
// FeaturedImageUpload.tsx / ReraCertificateUpload.tsx so the result is
// actually surfaced. No fields or data flow changed — only feedback wiring.

import { useState, useTransition } from "react";
import type { ActionResult } from "@/lib/admin/settings/actions";

const ReraCertificateDetailsForm = ({
   action,
   defaultTitle,
   defaultDescription,
}: {
   action: (formData: FormData) => Promise<ActionResult>;
   defaultTitle: string;
   defaultDescription: string;
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
            setError(result.error ?? "Could not update the certificate details. Please try again.");
            return;
         }
         setSaved(true);
      });
   };

   return (
      <form onSubmit={handleSubmit}>
         {error && (
            <div className="alert alert-danger py-2 px-3" role="alert">
               {error}
            </div>
         )}
         {saved && !isPending && (
            <div className="alert alert-success py-2 px-3" role="status">
               Saved.
            </div>
         )}
         <div className="mb-3">
            <label className="form-label fs-14">Title</label>
            <input
               type="text"
               name="title"
               defaultValue={defaultTitle}
               className="form-control"
               placeholder="e.g. RERA Registered"
               maxLength={120}
            />
         </div>
         <div className="mb-3">
            <label className="form-label fs-14">Description</label>
            <textarea
               name="description"
               defaultValue={defaultDescription}
               className="form-control"
               rows={3}
               placeholder="A short line explaining buyers can view the registration/certificate."
               maxLength={280}
            />
         </div>
         <button type="submit" className="btn btn-dark btn-sm" disabled={isPending}>
            {isPending ? "Saving..." : "Save text"}
         </button>
      </form>
   );
};

export default ReraCertificateDetailsForm;
