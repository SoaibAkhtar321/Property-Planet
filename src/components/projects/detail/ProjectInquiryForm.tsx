"use client";

// src/components/projects/detail/ProjectInquiryForm.tsx
//
// Phase 20: this was one of three separate enquiry surfaces (project
// detail, property detail, nothing on cards). It is now a thin trigger for
// the single universal inquiry dialog mounted in Wrapper.tsx, so the
// project detail page, the project card and every other entry point share
// one form, one validation path and one server action
// (createProjectInquiry -> `leads`, project_id set / property_id NULL).
//
// The logged-out branch is gone on purpose: the dialog itself handles an
// unauthenticated buyer by stashing the enquiry, sending them through
// Google, and finishing the submission when they come back — instead of
// bouncing them into a login modal and losing the project.
//
// The seller/admin case still explains itself rather than rendering an
// empty space, and the role check remains presentation only: the real gate
// is server-side in the action.

import { useSupabaseUser } from "@/hooks/useSupabaseUser";
import InquiryButton from "@/components/inquiry/InquiryButton";

const ProjectInquiryForm = ({
   projectId,
   projectTitle,
   projectLocation,
}: {
   projectId: string;
   projectTitle: string;
   projectLocation?: string;
}) => {
   const { role, loading } = useSupabaseUser();

   if (loading) return null;

   if (role && role !== "buyer") {
      return (
         <p className="fs-16 m0" role="status">
            Enquiries are sent from buyer accounts. Sign in with a buyer account to contact the team
            about this project.
         </p>
      );
   }

   return (
      <InquiryButton
   kind="project"
   id={projectId}
   title={projectTitle}
   subtitle={projectLocation}
   className="pp-card-btn pp-card-btn--primary px-4"
   label="Send Inquiry"
/>
   );
};

export default ProjectInquiryForm;
