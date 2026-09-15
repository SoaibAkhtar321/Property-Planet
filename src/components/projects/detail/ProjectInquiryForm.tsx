"use client";

// src/components/projects/detail/ProjectInquiryForm.tsx
//
// Project-level enquiry on the project detail page. Reuses the existing
// leads system — createProjectInquiry() (src/lib/leads/actions.ts), which
// writes a `leads` row with project_id set and property_id NULL per
// 0013_leads_project_id.sql. No second enquiry system is introduced, and
// unit-level enquiries are untouched: those still go through the unit's
// own property detail page and createInquiry(), which already copies the
// project_id onto the lead.
//
// Role branching is presentation only, exactly as in
// src/components/properties/detail/InquiryForm.tsx — the real gate is
// requireRole(["buyer"]) inside the server action. buyer_id is never sent
// from here; the only client-supplied values are the project id (which the
// action re-validates against project_public) and an optional message.

import { useState, useTransition } from "react";
import { useSupabaseUser } from "@/hooks/useSupabaseUser";
import { createProjectInquiry } from "@/lib/leads/actions";

type ActionState = { success: boolean; error?: string; alreadyExists?: boolean } | null;

const ProjectInquiryForm = ({ projectId, projectTitle }: { projectId: string; projectTitle: string }) => {
   const { user, role, loading } = useSupabaseUser();
   const [message, setMessage] = useState("");
   const [isPending, startTransition] = useTransition();
   const [result, setResult] = useState<ActionState>(null);

   if (loading) return null;

   if (!user) {
      return (
         <a href="#" data-bs-toggle="modal" data-bs-target="#loginModal" className="btn-four">
            Enquire About This Project <i className="bi bi-arrow-up-right ms-2"></i>
         </a>
      );
   }

   // Sellers and admins have no buyer enquiry flow, but rendering nothing
   // at all leaves a heading with an empty space under it. Say why instead.
   if (role !== "buyer") {
      return (
         <p className="fs-16 m0" role="status">
            Enquiries are sent from buyer accounts. Sign in with a buyer account to contact the team about this
            project.
         </p>
      );
   }

   if (result?.success) {
      return (
         <div className="alert alert-success mb-0" role="status">
            {result.alreadyExists
               ? `You've already sent an enquiry about ${projectTitle}.`
               : "Your enquiry has been sent. The team will be in touch soon."}
         </div>
      );
   }

   const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      startTransition(async () => {
         const res = await createProjectInquiry(projectId, message);
         setResult(res);
         if (res.success) setMessage("");
      });
   };

   return (
      <form onSubmit={handleSubmit}>
         <textarea
            className="w-100 mb-15"
            rows={3}
            placeholder={`Ask a question about ${projectTitle} (optional)`}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={isPending}
            maxLength={1000}
         />
         {result?.error && (
            <div className="alert alert-danger mb-15" role="alert">
               {result.error}
            </div>
         )}
         <button type="submit" className="btn-four" disabled={isPending}>
            {isPending ? "Sending..." : "Enquire About This Project"}
            <i className="bi bi-arrow-up-right ms-2"></i>
         </button>
      </form>
   );
};

export default ProjectInquiryForm;
