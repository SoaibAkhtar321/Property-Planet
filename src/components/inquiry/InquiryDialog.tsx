"use client";

// src/components/inquiry/InquiryDialog.tsx
//
// The single enquiry surface for the whole public site. Mounted once in
// src/layouts/Wrapper.tsx (the same place PropertyPlanetAIWidget is
// mounted), opened from anywhere via openInquiry() on inquiryBus.
//
// It is NOT a second lead system. It submits through the existing
// createInquiry() / createProjectInquiry() server actions, which insert
// into the existing `leads` table, so every enquiry lands in the existing
// Admin -> Leads screen with no new admin page and no parallel storage.
//
// Fields:
//   Name    — REQUIRED (validated here and, decisively, on the server)
//   Phone   — REQUIRED (validated here and, decisively, on the server)
//   Message — optional
//   Date    — optional; absent means NULL, never a made-up date
//   Time    — optional; absent means NULL, never a made-up time
// Email is not asked for: it comes from the authenticated Google
// account/profile. Name IS asked for explicitly even though a signed-in
// buyer's profile already has one — this is "the name given with this
// specific enquiry", the same reasoning as asking for phone explicitly
// instead of only trusting profiles.phone.
//
// Auth interruption: if the buyer isn't signed in, everything typed is
// stashed in sessionStorage (see inquiryBus), Google sign-in is started
// with ?next= back to the current page, and on return this component
// reopens on the same property/project and completes the submission
// automatically. No dashboard detour.
//
// Accessibility: real <dialog>-style semantics via role="dialog" +
// aria-modal, labelled heading, Escape to close, focus moved to the phone
// field on open and restored to the trigger on close, background scroll
// locked, and every field has a real <label>.

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { createInquiry, createProjectInquiry } from "@/lib/leads/actions";
import {
   clearPendingInquiry,
   consumePendingInquiry,
   onInquiryOpen,
   savePendingInquiry,
   type InquiryTarget,
} from "@/utils/inquiryBus";

type Phase = "form" | "authenticating" | "success";

const todayISO = () => new Date().toISOString().slice(0, 10);

const InquiryDialog = () => {
   const [target, setTarget] = useState<InquiryTarget | null>(null);
   const [name, setName] = useState("");
   const [phone, setPhone] = useState("");
   const [message, setMessage] = useState("");
   const [preferredDate, setPreferredDate] = useState("");
   const [preferredTime, setPreferredTime] = useState("");
   const [consentGiven, setConsentGiven] = useState(false);
   const [error, setError] = useState<string | null>(null);
   const [phase, setPhase] = useState<Phase>("form");
   const [alreadyExists, setAlreadyExists] = useState(false);
   const [isPending, startTransition] = useTransition();

   const nameRef = useRef<HTMLInputElement | null>(null);
   const phoneRef = useRef<HTMLInputElement | null>(null);
   const consentRef = useRef<HTMLInputElement | null>(null);
   const previouslyFocused = useRef<HTMLElement | null>(null);

   const reset = useCallback(() => {
      setName("");
      setPhone("");
      setMessage("");
      setPreferredDate("");
      setPreferredTime("");
      setConsentGiven(false);
      setError(null);
      setPhase("form");
      setAlreadyExists(false);
   }, []);

   const close = useCallback(() => {
      setTarget(null);
      reset();
      clearPendingInquiry();
      previouslyFocused.current?.focus?.();
   }, [reset]);

   const submit = useCallback(
      (
         t: InquiryTarget,
         values: { name: string; phone: string; message: string; date: string; time: string; consent: boolean },
      ) => {
         setError(null);
         startTransition(async () => {
            const contact = {
               name: values.name,
               phone: values.phone,
               message: values.message,
               preferredDate: values.date,
               preferredTime: values.time,
               consentGiven: values.consent,
            };

            const res =
               t.kind === "property"
                  ? await createInquiry(t.id, contact)
                  : await createProjectInquiry(t.id, contact);

            if (res.success) {
               clearPendingInquiry();
               setAlreadyExists(Boolean(res.alreadyExists));
               setPhase("success");
               return;
            }

            if (res.needsAuth) {
               // Not signed in. Keep the context, send them to Google, come
               // back to this exact page and finish.
               setPhase("authenticating");
               savePendingInquiry({
                  target: t,
                  name: values.name,
                  phone: values.phone,
                  message: values.message,
                  preferredDate: values.date,
                  preferredTime: values.time,
                  consentGiven: values.consent,
                  returnTo: `${window.location.pathname}${window.location.search}`,
                  savedAt: Date.now(),
               });

               const supabase = createClient();
               const next = `${window.location.pathname}${window.location.search}`;
               await supabase.auth.signInWithOAuth({
                  provider: "google",
                  options: {
                     redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
                  },
               });
               return;
            }

            setPhase("form");
            setError(res.error ?? "Something went wrong. Please try again.");
         });
      },
      [],
   );

   // Open requests from anywhere on the site.
   useEffect(() => {
      return onInquiryOpen((t) => {
         previouslyFocused.current = document.activeElement as HTMLElement | null;
         reset();
         setTarget(t);
      });
   }, [reset]);

   // Returning from Google: restore the stashed enquiry and finish it.
   useEffect(() => {
      const pending = consumePendingInquiry();
      if (!pending) return;

      setTarget(pending.target);
      setName(pending.name);
      setPhone(pending.phone);
      setMessage(pending.message);
      setPreferredDate(pending.preferredDate);
      setPreferredTime(pending.preferredTime);
      setConsentGiven(pending.consentGiven);

      if (pending.name && pending.phone && pending.consentGiven) {
         submit(pending.target, {
            name: pending.name,
            phone: pending.phone,
            message: pending.message,
            date: pending.preferredDate,
            time: pending.preferredTime,
            consent: pending.consentGiven,
         });
      }
      // Intentionally runs once on mount — this is the post-redirect hand-off.
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, []);

   // Escape to close + background scroll lock + initial focus.
   useEffect(() => {
      if (!target) return;

      const onKeyDown = (e: KeyboardEvent) => {
         if (e.key === "Escape") close();
      };
      document.addEventListener("keydown", onKeyDown);

      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";

      const focusTimer = window.setTimeout(() => nameRef.current?.focus(), 50);

      return () => {
         document.removeEventListener("keydown", onKeyDown);
         document.body.style.overflow = previousOverflow;
         window.clearTimeout(focusTimer);
      };
   }, [target, close]);

   if (!target) return null;

   const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!name.trim()) {
         setError("Name is required.");
         nameRef.current?.focus();
         return;
      }
      if (!phone.trim()) {
         setError("Phone number is required.");
         phoneRef.current?.focus();
         return;
      }
      if (!consentGiven) {
         setError("Please provide your consent before submitting your inquiry.");
         consentRef.current?.focus();
         return;
      }
      submit(target, { name, phone, message, date: preferredDate, time: preferredTime, consent: consentGiven });
   };

   const busy = isPending || phase === "authenticating";

   return (
      <div className="pp-inquiry-overlay" onMouseDown={(e) => e.target === e.currentTarget && close()}>
         <div
            className="pp-inquiry-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pp-inquiry-title"
         >
            <button type="button" className="pp-inquiry-close" onClick={close} aria-label="Close inquiry form">
               <i className="bi bi-x-lg" aria-hidden="true"></i>
            </button>

            {phase === "success" ? (
               <div className="pp-inquiry-success" role="status">
                  <div className="pp-inquiry-success__icon" aria-hidden="true">
                     <i className="bi bi-check-lg"></i>
                  </div>
                  <h4 id="pp-inquiry-title" className="mb-10">
                     {alreadyExists ? "You've already enquired" : "Inquiry Sent Successfully"}
                  </h4>
                  <p className="fs-16 mb-20">
                     {alreadyExists ? (
                        <>
                           We already have your enquiry for <strong>{target.title}</strong>. The Property
                           Planet team will be in touch.
                        </>
                     ) : (
                        <>
                           Thanks — your enquiry about <strong>{target.title}</strong> has reached the
                           Property Planet team. Someone will call you on the number you shared.
                        </>
                     )}
                  </p>
                  <a href="tel:8096786351" className="pp-inquiry-call">
                     <i className="bi bi-telephone-fill" aria-hidden="true"></i> Or call us on 8096786351
                  </a>
                  <button type="button" className="btn-four w-100 justify-content-center mt-20" onClick={close}>
                     Done
                  </button>
               </div>
            ) : (
               <form onSubmit={handleSubmit} noValidate>
                  <h4 id="pp-inquiry-title" className="mb-5">
                     Send Inquiry
                  </h4>
                  <p className="pp-inquiry-target fs-16 mb-25">
                     {target.title}
                     {target.subtitle && <span className="d-block fs-14 opacity-75">{target.subtitle}</span>}
                  </p>

                  <div className="mb-20">
                     <label className="fs-15 fw-500 mb-8 d-block" htmlFor="pp-inquiry-name">
                        Name <span className="pp-inquiry-req">*</span>
                     </label>
                     <input
                        ref={nameRef}
                        id="pp-inquiry-name"
                        name="name"
                        type="text"
                        autoComplete="name"
                        required
                        maxLength={120}
                        className="w-100"
                        placeholder="Your full name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        disabled={busy}
                     />
                  </div>

                  <div className="mb-20">
                     <label className="fs-15 fw-500 mb-8 d-block" htmlFor="pp-inquiry-phone">
                        Phone number <span className="pp-inquiry-req">*</span>
                     </label>
                     <input
                        ref={phoneRef}
                        id="pp-inquiry-phone"
                        name="phone"
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel"
                        required
                        maxLength={20}
                        className="w-100"
                        placeholder="e.g. 98765 43210"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        disabled={busy}
                        aria-describedby="pp-inquiry-phone-help"
                     />
                     <span id="pp-inquiry-phone-help" className="fs-13 opacity-75">
                        We only use this to call you back about this property.
                     </span>
                  </div>

                  <div className="mb-20">
                     <label className="fs-15 fw-500 mb-8 d-block" htmlFor="pp-inquiry-message">
                        Message <span className="opacity-75 fw-400">(optional)</span>
                     </label>
                     <textarea
                        id="pp-inquiry-message"
                        name="message"
                        rows={3}
                        maxLength={1000}
                        className="w-100"
                        placeholder="e.g. Interested in this plot — would like to discuss pricing and arrange a visit."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        disabled={busy}
                     />
                  </div>

                  <div className="row gx-3">
                     <div className="col-6 mb-20">
                        <label className="fs-15 fw-500 mb-8 d-block" htmlFor="pp-inquiry-date">
                           Preferred date <span className="opacity-75 fw-400">(optional)</span>
                        </label>
                        <input
                           id="pp-inquiry-date"
                           name="preferredDate"
                           type="date"
                           min={todayISO()}
                           className="w-100"
                           value={preferredDate}
                           onChange={(e) => setPreferredDate(e.target.value)}
                           disabled={busy}
                        />
                     </div>
                     <div className="col-6 mb-20">
                        <label className="fs-15 fw-500 mb-8 d-block" htmlFor="pp-inquiry-time">
                           Preferred time <span className="opacity-75 fw-400">(optional)</span>
                        </label>
                        <input
                           id="pp-inquiry-time"
                           name="preferredTime"
                           type="time"
                           className="w-100"
                           value={preferredTime}
                           onChange={(e) => setPreferredTime(e.target.value)}
                           disabled={busy}
                        />
                     </div>
                  </div>

                  <div className="pp-inquiry-consent mb-20">
                     <input
                        ref={consentRef}
                        id="pp-inquiry-consent"
                        name="consent"
                        type="checkbox"
                        checked={consentGiven}
                        onChange={(e) => {
                           setConsentGiven(e.target.checked);
                           if (e.target.checked && error) setError(null);
                        }}
                        disabled={busy}
                        aria-required="true"
                     />
                     <label htmlFor="pp-inquiry-consent">
                        I agree to Property Planet collecting and using the information I
                        provide to process my inquiry and connect me with the relevant
                        property representative. <Link href="/privacy-policy" target="_blank">Privacy Policy</Link>
                     </label>
                  </div>

                  {error && (
                     <div className="alert alert-danger py-2 px-3 fs-15 mb-20" role="alert">
                        {error}
                     </div>
                  )}

                  <button
                     type="submit"
                     className="btn-four w-100 justify-content-center"
                     disabled={busy}
                  >
                     {phase === "authenticating"
                        ? "Taking you to Google..."
                        : isPending
                          ? "Sending..."
                          : "Send Inquiry"}
                  </button>

                  <p className="fs-13 opacity-75 mt-15 mb-0">
                     If you&apos;re not signed in yet, we&apos;ll sign you in with Google and bring you
                     straight back here — your enquiry is kept.
                  </p>
               </form>
            )}
         </div>
      </div>
   );
};

export default InquiryDialog;
