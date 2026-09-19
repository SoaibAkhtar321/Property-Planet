"use client";

// src/components/assistance/VisitorAssistance.tsx
//
// Phase 4: Visitor Assistance / Property Lead Capture.
//
// A small, dismissible corner card that lets an actively browsing visitor
// voluntarily ask Property Planet for help. It does NOT identify anonymous
// visitors or obtain a phone number through anything but the visitor
// typing it into the form themselves — no hover tracking, no device
// fingerprinting, no hidden fields.
//
// Where it appears: only on /, /properties, /projects, /places (never
// admin, dashboard, auth, or /contact — those already have their own
// contact surface).
//
// Trigger (client-side engagement heuristic only — nothing server-side
// depends on this, it only decides when to *show* the card):
//   - 2+ property pages viewed this session, OR
//   - 1 property page + ~40s of active time on it, OR
//   - ~2 minutes of active browsing time overall
// "Active" excludes idle time and hidden tabs (document.visibilityState).
//
// Dismissal (sessionStorage/localStorage only — no server-side tracking):
//   - Closed -> hidden for 14 days
//   - Submitted -> hidden for 30 days
//   - Max 2 appearances per session
//   - The existing enquiry dialog opening hides this for the rest of the
//     session (avoids two competing "talk to us" surfaces at once)
//
// Positioned bottom-left specifically so it never overlaps the AI widget
// or the scroll-to-top button, both of which live bottom-right.

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { submitVisitorAssistance, getVisitorAssistancePrefill } from "@/lib/leads/assistanceActions";
import {
   VISITOR_REQUIREMENT_TYPES,
   VISITOR_REQUIREMENT_TYPE_LABELS,
   type VisitorRequirementType,
} from "@/lib/leads/assistanceOptions";
import { onInquiryOpen } from "@/utils/inquiryBus";

const ELIGIBLE_PREFIXES = ["/properties", "/projects", "/places"];
const DISMISS_KEY = "pp_va_dismissed_until";
const SUBMITTED_KEY = "pp_va_submitted_until";
const SESSION_SHOWN_KEY = "pp_va_session_shown_count";
const SESSION_SUPPRESS_KEY = "pp_va_session_suppressed";

const MAX_APPEARANCES_PER_SESSION = 2;
const DISMISS_DAYS = 14;
const SUBMITTED_DAYS = 30;
const ONE_PROPERTY_ACTIVE_SECONDS = 40;
const GENERAL_ACTIVE_SECONDS = 120;
const ACTIVE_TICK_MS = 1000;

function isEligiblePath(pathname: string): boolean {
   if (pathname === "/") return true;
   return ELIGIBLE_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

function daysFromNow(days: number): number {
   return Date.now() + days * 24 * 60 * 60 * 1000;
}

function readSuppressedUntil(key: string): number {
   try {
      const raw = window.localStorage.getItem(key);
      return raw ? Number(raw) || 0 : 0;
   } catch {
      return 0;
   }
}

function isCurrentlySuppressed(): boolean {
   const now = Date.now();
   if (readSuppressedUntil(DISMISS_KEY) > now) return true;
   if (readSuppressedUntil(SUBMITTED_KEY) > now) return true;
   try {
      if (window.sessionStorage.getItem(SESSION_SUPPRESS_KEY) === "1") return true;
      const shown = Number(window.sessionStorage.getItem(SESSION_SHOWN_KEY) ?? "0");
      if (shown >= MAX_APPEARANCES_PER_SESSION) return true;
   } catch {
      /* sessionStorage unavailable — fail open on the session-only caps */
   }
   return false;
}

type Phase = "hidden" | "prompt" | "form" | "success";

const VisitorAssistance = () => {
   const pathname = usePathname() || "/";
   const [phase, setPhase] = useState<Phase>("hidden");
   const [name, setName] = useState("");
   const [phone, setPhone] = useState("");
   const [email, setEmail] = useState("");
   const [requirementType, setRequirementType] = useState<VisitorRequirementType>("plot_land");
   const [location, setLocation] = useState("");
   const [budget, setBudget] = useState("");
   const [details, setDetails] = useState("");
   const [error, setError] = useState<string | null>(null);
   const [submitting, setSubmitting] = useState(false);

   const propertyPagesViewed = useRef(0);
   const activeSeconds = useRef(0);
   const activeSecondsOnThisPropertyPage = useRef(0);
   const triggeredRef = useRef(false);
   const lastPathRef = useRef<string | null>(null);
   const prefillLoadedRef = useRef(false);

   // Hide immediately (for the rest of this session) if the existing
   // enquiry dialog is opened — never compete for the visitor's attention.
   useEffect(() => {
      const unsubscribe = onInquiryOpen(() => {
         setPhase("hidden");
         try {
            window.sessionStorage.setItem(SESSION_SUPPRESS_KEY, "1");
         } catch {
            /* best effort only */
         }
      });
      return unsubscribe;
   }, []);

   // Route eligibility + per-property-page view counting.
   useEffect(() => {
      if (!isEligiblePath(pathname)) {
         setPhase("hidden");
         return;
      }

      const isPropertyPage = pathname.startsWith("/properties/") && pathname !== "/properties";
      if (lastPathRef.current !== pathname) {
         lastPathRef.current = pathname;
         activeSecondsOnThisPropertyPage.current = 0;
         if (isPropertyPage) {
            propertyPagesViewed.current += 1;
         }
      }
   }, [pathname]);

   // Active-time tracking (excludes idle tabs) + trigger evaluation.
   useEffect(() => {
      if (!isEligiblePath(pathname) || triggeredRef.current) return;
      if (isCurrentlySuppressed()) return;

      const isPropertyPage = pathname.startsWith("/properties/") && pathname !== "/properties";

      const interval = window.setInterval(() => {
         if (document.visibilityState !== "visible") return;

         activeSeconds.current += 1;
         if (isPropertyPage) {
            activeSecondsOnThisPropertyPage.current += 1;
         }

         const twoPlusPropertyPages = propertyPagesViewed.current >= 2;
         const onePropertyPagePlusTime =
            propertyPagesViewed.current >= 1 && activeSecondsOnThisPropertyPage.current >= ONE_PROPERTY_ACTIVE_SECONDS;
         const generalTime = activeSeconds.current >= GENERAL_ACTIVE_SECONDS;

         if (twoPlusPropertyPages || onePropertyPagePlusTime || generalTime) {
            triggeredRef.current = true;
            if (!isCurrentlySuppressed()) {
               setPhase("prompt");
               try {
                  const shown = Number(window.sessionStorage.getItem(SESSION_SHOWN_KEY) ?? "0");
                  window.sessionStorage.setItem(SESSION_SHOWN_KEY, String(shown + 1));
               } catch {
                  /* best effort only */
               }
            }
         }
      }, ACTIVE_TICK_MS);

      return () => window.clearInterval(interval);
      // Re-created per pathname change so isPropertyPage stays correct;
      // triggeredRef/propertyPagesViewed persist across that recreation.
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [pathname]);

   // Prefill for a signed-in visitor — only into empty fields, never
   // overriding anything already typed, and nothing is auto-submitted.
   useEffect(() => {
      if (phase !== "form" || prefillLoadedRef.current) return;
      prefillLoadedRef.current = true;
      getVisitorAssistancePrefill()
         .then((prefill) => {
            if (!prefill) return;
            setName((current) => current || prefill.name);
            setPhone((current) => current || prefill.phone);
            setEmail((current) => current || prefill.email);
         })
         .catch(() => {
            /* best effort only — the form works fine without a prefill */
         });
   }, [phase]);

   const dismiss = () => {
      setPhase("hidden");
      try {
         window.localStorage.setItem(DISMISS_KEY, String(daysFromNow(DISMISS_DAYS)));
      } catch {
         /* best effort only */
      }
   };

   const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      setSubmitting(true);

      const propertySlug = pathname.startsWith("/properties/") && pathname !== "/properties"
         ? pathname.split("/").filter(Boolean).pop() ?? null
         : null;

      const result = await submitVisitorAssistance({
         name,
         phone,
         email,
         requirementType,
         location,
         budget,
         details,
         propertySlug,
      });

      setSubmitting(false);

      if (!result.success) {
         setError(result.error ?? "Something went wrong. Please try again.");
         return;
      }

      setPhase("success");
      try {
         window.localStorage.setItem(SUBMITTED_KEY, String(daysFromNow(SUBMITTED_DAYS)));
      } catch {
         /* best effort only */
      }
   };

   if (phase === "hidden") return null;

   return (
      <div className="pp-visitor-assistance" role="complementary" aria-label="Property assistance">
         {phase === "prompt" && (
            <div className="pp-va-card pp-va-prompt">
               <button type="button" className="pp-va-close" aria-label="Dismiss" onClick={dismiss}>
                  ×
               </button>
               <p className="pp-va-title">Need help finding the right property?</p>
               <p className="pp-va-subtitle">Tell us what you&apos;re looking for and we&apos;ll reach out.</p>
               <div className="pp-va-actions">
                  <button type="button" className="btn-one pp-va-btn" onClick={() => setPhase("form")}>
                     Get Assistance
                  </button>
               </div>
            </div>
         )}

         {phase === "form" && (
            <div className="pp-va-card pp-va-form">
               <button type="button" className="pp-va-close" aria-label="Dismiss" onClick={dismiss}>
                  ×
               </button>
               <p className="pp-va-title">Request assistance</p>
               <form onSubmit={handleSubmit}>
                  <div className="pp-va-field">
                     <label htmlFor="pp-va-name">Name *</label>
                     <input
                        id="pp-va-name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        maxLength={120}
                     />
                  </div>
                  <div className="pp-va-field">
                     <label htmlFor="pp-va-phone">Phone *</label>
                     <input
                        id="pp-va-phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                     />
                  </div>
                  <div className="pp-va-field">
                     <label htmlFor="pp-va-requirement">What you&apos;re looking for *</label>
                     <select
                        id="pp-va-requirement"
                        value={requirementType}
                        onChange={(e) => setRequirementType(e.target.value as VisitorRequirementType)}
                        required
                     >
                        {VISITOR_REQUIREMENT_TYPES.map((t) => (
                           <option key={t} value={t}>
                              {VISITOR_REQUIREMENT_TYPE_LABELS[t]}
                           </option>
                        ))}
                     </select>
                  </div>
                  <div className="pp-va-field">
                     <label htmlFor="pp-va-email">Email (optional)</label>
                     <input id="pp-va-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                  <div className="pp-va-field">
                     <label htmlFor="pp-va-location">Preferred location (optional)</label>
                     <input
                        id="pp-va-location"
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        maxLength={120}
                     />
                  </div>
                  <div className="pp-va-field">
                     <label htmlFor="pp-va-budget">Budget (optional)</label>
                     <input
                        id="pp-va-budget"
                        type="text"
                        value={budget}
                        onChange={(e) => setBudget(e.target.value)}
                        maxLength={60}
                     />
                  </div>
                  <div className="pp-va-field">
                     <label htmlFor="pp-va-details">Additional details (optional)</label>
                     <textarea
                        id="pp-va-details"
                        value={details}
                        onChange={(e) => setDetails(e.target.value)}
                        maxLength={1000}
                        rows={3}
                     />
                  </div>

                  {error && <p className="pp-va-error">{error}</p>}

                  <button type="submit" className="btn-one pp-va-btn" disabled={submitting}>
                     {submitting ? "Sending…" : "Send Request"}
                  </button>
               </form>
            </div>
         )}

         {phase === "success" && (
            <div className="pp-va-card pp-va-success">
               <button type="button" className="pp-va-close" aria-label="Dismiss" onClick={() => setPhase("hidden")}>
                  ×
               </button>
               <p className="pp-va-title">Thanks — we&apos;ve got it!</p>
               <p className="pp-va-subtitle">Our team will reach out to you shortly.</p>
            </div>
         )}
      </div>
   );
};

export default VisitorAssistance;
