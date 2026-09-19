"use client";

// Phase 9: buyer-facing cancellation for cancelSiteVisit() (0022). All rules
// (own visit only, requested/confirmed only, no time cutoff, lead untouched,
// row kept as status='cancelled', seller notified by DB trigger) live in the
// server action and the database — this component only asks for confirmation,
// calls it, and refreshes the list.

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cancelSiteVisit } from "@/lib/leads/actions";

const CancelSiteVisitButton = ({ siteVisitId }: { siteVisitId: string }) => {
   const router = useRouter();
   const [isPending, startTransition] = useTransition();
   const [confirming, setConfirming] = useState(false);
   const [error, setError] = useState<string | null>(null);

   const handleCancel = () => {
      setError(null);
      startTransition(async () => {
         const res = await cancelSiteVisit(siteVisitId);
         if (res.success) {
            setConfirming(false);
            router.refresh();
         } else {
            setError(res.error ?? "Could not cancel the site visit. Please try again.");
         }
      });
   };

   if (!confirming) {
      return (
         <button
            type="button"
            className="btn btn-sm btn-outline-danger"
            onClick={() => setConfirming(true)}
         >
            Cancel visit
         </button>
      );
   }

   return (
      <div className="d-flex flex-column align-items-start gap-2">
         <span className="fs-14">Cancel this site visit?</span>
         <div className="d-flex gap-2">
            <button type="button" className="btn btn-sm btn-danger" onClick={handleCancel} disabled={isPending}>
               {isPending ? "Cancelling..." : "Yes, cancel"}
            </button>
            <button
               type="button"
               className="btn btn-sm btn-outline-secondary"
               onClick={() => {
                  setConfirming(false);
                  setError(null);
               }}
               disabled={isPending}
            >
               Keep visit
            </button>
         </div>
         {error && (
            <div className="text-danger fs-14" role="alert">
               {error}
            </div>
         )}
      </div>
   );
};

export default CancelSiteVisitButton;
