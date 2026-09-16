"use client";

// src/components/inquiry/InquiryButton.tsx
//
// The one "Send Inquiry" trigger used by property cards, project cards,
// property detail, project detail and project units. It holds no form
// state and talks to no lead code — it just opens the globally-mounted
// InquiryDialog with the target it was given.
//
// That is what keeps the enquiry flow single-sourced: adding an enquiry
// entry point anywhere is this one component plus an id, never another
// form and never another insert path.
//
// Deliberately NOT used on Place/locality cards — those are discovery
// navigation ("View Properties"), not something you can enquire about.

import { openInquiry, type InquiryTargetKind } from "@/utils/inquiryBus";

const InquiryButton = ({
   kind,
   id,
   title,
   subtitle,
   className = "pp-card-btn pp-card-btn--primary",
   label = "Send Inquiry",
}: {
   kind: InquiryTargetKind;
   id: string;
   title: string;
   subtitle?: string;
   className?: string;
   label?: string;
}) => {
   return (
      <button
         type="button"
         className={className}
         onClick={() => openInquiry({ kind, id, title, subtitle })}
         aria-label={`Send an inquiry about ${title}`}
      >
         {label}
      </button>
   );
};

export default InquiryButton;
