"use client";

// src/components/properties/detail/InquiryForm.tsx
//
// Phase 3: replaces the static "Enquire Now" link in Sidebar.tsx, and now
// also hosts the site-visit request step for a buyer's own lead.
//
// Role branching here is UI presentation only, same disclaimer as
// useSupabaseUser() itself — the real authorization gate is
// requireRole(["buyer"]) inside createInquiry()/createSiteVisit() on the
// server. This component's job is just to show the right thing:
//   loading        -> render nothing (avoid a flash of the wrong state)
//   logged out     -> existing #loginModal trigger, same pattern used in
//                      the headers (data-bs-toggle/data-bs-target)
//   buyer          -> inquiry form, or (once a lead exists) the site-visit
//                      request section
//   seller / admin -> nothing (no buyer inquiry/site-visit UI for non-buyers)
//
// lead_id is never accepted as a prop or from anywhere client-controlled —
// it is only ever the value returned by getMyLeadForProperty(), which is
// itself scoped server-side to the authenticated buyer's own row.

import { useEffect, useState, useTransition } from "react";
import { useSupabaseUser } from "@/hooks/useSupabaseUser";
import { createSiteVisit, getMyLeadForProperty, revealExactLocation } from "@/lib/leads/actions";
import InquiryButton from "@/components/inquiry/InquiryButton";

type ActionState = { success: boolean; error?: string; alreadyExists?: boolean } | null;

// Minimal reveal action for Finding #3 — wiring only, no redesign. All
// eligibility logic lives in the reveal_exact_location() RPC; this just
// calls it and shows a locked state until it succeeds. Deliberately does
// not render raw lat/lng (no existing UI requires that) and never touches
// seller contact info.
const ExactLocationSection = ({ leadId }: { leadId: string }) => {
   const [isPending, startTransition] = useTransition();
   const [result, setResult] = useState<{
      success: boolean;
      error?: string;
      exactLat?: number;
      exactLng?: number;
      exactAddress?: string;
   } | null>(null);

   const handleReveal = () => {
      startTransition(async () => {
         const res = await revealExactLocation(leadId);
         setResult(res);
      });
   };

   if (result?.success) {
      return (
         <div className="mt-15">
            <div className="alert alert-success mb-15" role="status">
               Exact location: {result.exactAddress}
            </div>
            {typeof result.exactLat === "number" && typeof result.exactLng === "number" && (
               <div className="gmap_canvas" style={{ height: 300 }}>
                  <iframe
                     src={`https://maps.google.com/maps?q=${result.exactLat},${result.exactLng}&z=17&output=embed`}
                     width="100%"
                     height="300"
                     style={{ border: 0 }}
                     allowFullScreen
                     loading="lazy"
                     referrerPolicy="no-referrer-when-downgrade"
                  ></iframe>
               </div>
            )}
         </div>
      );
   }

   return (
      <div className="mt-15">
         <button
            type="button"
            className="btn-four w-100 justify-content-center"
            onClick={handleReveal}
            disabled={isPending}
         >
            {isPending ? "Checking..." : "Get Exact Location"}
         </button>
         {result?.error && <div className="fs-14 mt-10">{result.error}</div>}
      </div>
   );
};

const SiteVisitSection = ({ leadId }: { leadId: string }) => {
   const [scheduledAt, setScheduledAt] = useState("");
   const [notes, setNotes] = useState("");
   const [isPending, startTransition] = useTransition();
   const [result, setResult] = useState<ActionState>(null);

   const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!scheduledAt) {
         setResult({ success: false, error: "Please choose a date and time." });
         return;
      }
      // datetime-local gives an unqualified string (e.g. "2026-09-15T14:30")
      // with no timezone info. `new Date(...)` on that string, run here in
      // the browser, correctly interprets it against the buyer's own local
      // timezone. Converting to ISO now — before it ever leaves the client —
      // means the server only ever sees an unambiguous instant, regardless
      // of what timezone the server itself runs in.
      const scheduledDate = new Date(scheduledAt);
      if (Number.isNaN(scheduledDate.getTime())) {
         setResult({ success: false, error: "Please choose a valid date and time." });
         return;
      }
      startTransition(async () => {
         const res = await createSiteVisit(leadId, scheduledDate.toISOString(), notes);
         setResult(res);
         if (res.success) {
            setNotes("");
         }
      });
   };

   if (result?.success) {
      return (
         <div className="alert alert-success mb-0 mt-15" role="status">
            {result.alreadyExists
               ? "You already have a pending site visit request for this property."
               : "Your site visit request has been sent. The team will confirm the timing with you."}
         </div>
      );
   }

   return (
      <form onSubmit={handleSubmit} className="mt-15">
         <h6 className="mb-10">Request a Site Visit</h6>
         <input
            type="datetime-local"
            className="w-100 mb-15"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            disabled={isPending}
            required
         />
         <textarea
            className="w-100 mb-15"
            rows={2}
            placeholder="Anything the team should know (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={isPending}
            maxLength={1000}
         />
         {result?.error && (
            <div className="alert alert-danger mb-15" role="alert">
               {result.error}
            </div>
         )}
         <button type="submit" className="btn-four w-100 justify-content-center" disabled={isPending}>
            {isPending ? "Requesting..." : "Request Site Visit"}
         </button>
      </form>
   );
};

// Phase 20: the enquiry half of this component is gone — it now delegates
// to the single universal inquiry dialog (InquiryButton -> InquiryDialog),
// the same one the property cards, project cards and project detail page
// use. That is what makes phone-mandatory / optional date / optional time /
// optional message one implementation instead of three, and what lets a
// logged-out buyer authenticate mid-enquiry without losing this property.
//
// What stays here is everything that only makes sense once a lead ALREADY
// exists and is therefore specific to the detail page: requesting a site
// visit on that lead, and revealing the exact location. Neither is part of
// the enquiry itself.
//
// lead_id is still never accepted as a prop or from anywhere
// client-controlled — it is only ever what getMyLeadForProperty() returns,
// which is scoped server-side to the authenticated buyer's own row.
const InquiryForm = ({
   propertyId,
   propertyTitle,
   propertyAddress,
}: {
   propertyId: string;
   propertyTitle: string;
   propertyAddress?: string;
}) => {
   const { user, role, loading } = useSupabaseUser();
   const [leadId, setLeadId] = useState<string | null>(null);
   const [leadLoading, setLeadLoading] = useState(true);

   // Resolve any lead the buyer already has on this property, so a repeat
   // visitor goes straight to the site-visit section instead of being asked
   // to enquire again.
   useEffect(() => {
      if (loading || !user || role !== "buyer") {
         setLeadLoading(false);
         return;
      }
      let isMounted = true;
      setLeadLoading(true);
      getMyLeadForProperty(propertyId).then((lead) => {
         if (!isMounted) return;
         setLeadId(lead?.leadId ?? null);
         setLeadLoading(false);
      });
      return () => {
         isMounted = false;
      };
   }, [loading, user, role, propertyId]);

   if (loading) {
      return null;
   }

   // Sellers and admins get no buyer enquiry UI, same as before.
   if (role && role !== "buyer") {
      return null;
   }

   if (user && leadLoading) {
      return null;
   }

   if (leadId) {
      return (
         <div>
            <SiteVisitSection leadId={leadId} />
            <ExactLocationSection leadId={leadId} />
         </div>
      );
   }

   // Guests included: the dialog handles authentication itself and returns
   // here afterwards with the enquiry intact.
   return (
      <InquiryButton
         kind="property"
         id={propertyId}
         title={propertyTitle}
         subtitle={propertyAddress}
         className="btn-four w-100 justify-content-center"
         label="Send Inquiry"
      />
   );
};

export default InquiryForm;
