"use client";

// src/components/properties/detail/PropertyStickyCta.tsx
//
// Mobile/tablet-only sticky action bar for the public property detail page.
// On phones the enquiry panel lives at the very bottom of a long page (the
// sidebar stacks under the content), so the primary action was several
// screens away from the price and gallery.
//
// It adds NO new lead path and reveals no seller data:
//   - guests and buyers without a lead -> the same universal InquiryButton
//     (kind="property") the sidebar and property cards use, so the dialog,
//     phone-required rule and mid-enquiry sign-in are unchanged;
//   - buyers who already have a lead   -> scrolls to the existing
//     site-visit section in the sidebar (#property-enquiry-panel);
//   - sellers / admins                 -> nothing, exactly like the sidebar.
//
// Layout safety: hidden from lg up (the sidebar is beside the content
// there); hidden while the enquiry panel itself is on screen so the two
// never duplicate; respects the iOS safe area; sits under the AI widget
// (z-index) and the AI button / scroll-to-top are nudged above it via the
// `pp-has-sticky-cta` class while this is mounted; a spacer keeps the last
// page content (footer) from being covered.

import { useEffect, useState } from "react";
import { useSupabaseUser } from "@/hooks/useSupabaseUser";
import { getMyLeadForProperty } from "@/lib/leads/actions";
import InquiryButton from "@/components/inquiry/InquiryButton";

const PANEL_ID = "property-enquiry-panel";

const PropertyStickyCta = ({
   propertyId,
   propertyTitle,
   propertyAddress,
   priceLabel,
}: {
   propertyId: string;
   propertyTitle: string;
   propertyAddress?: string;
   priceLabel: string;
}) => {
   const { user, role, loading } = useSupabaseUser();
   const [hasLead, setHasLead] = useState(false);
   const [leadChecked, setLeadChecked] = useState(false);
   const [panelVisible, setPanelVisible] = useState(false);

   // Same lookup InquiryForm uses; scoped server-side to the caller's own lead.
   useEffect(() => {
      if (loading) return;
      if (!user || role !== "buyer") {
         setHasLead(false);
         setLeadChecked(true);
         return;
      }
      let mounted = true;
      getMyLeadForProperty(propertyId)
         .then((lead) => {
            if (!mounted) return;
            setHasLead(Boolean(lead?.leadId));
            setLeadChecked(true);
         })
         .catch(() => {
            if (!mounted) return;
            setHasLead(false);
            setLeadChecked(true);
         });
      return () => {
         mounted = false;
      };
   }, [loading, user, role, propertyId]);

   // Hide while the sidebar enquiry panel is in view.
   useEffect(() => {
      const panel = document.getElementById(PANEL_ID);
      if (!panel || typeof IntersectionObserver === "undefined") return;
      const observer = new IntersectionObserver(([entry]) => setPanelVisible(entry.isIntersecting), {
         threshold: 0.15,
      });
      observer.observe(panel);
      return () => observer.disconnect();
   }, []);

   const visible = !loading && leadChecked && (!role || role === "buyer");

   // Lets the AI button / scroll-to-top move up out from under the bar.
   useEffect(() => {
      if (!visible) return;
      document.documentElement.classList.add("pp-has-sticky-cta");
      return () => document.documentElement.classList.remove("pp-has-sticky-cta");
   }, [visible]);

   if (!visible) return null;

   const scrollToPanel = () => {
      document.getElementById(PANEL_ID)?.scrollIntoView({ behavior: "smooth", block: "start" });
   };

   return (
      <>
         <div className="pp-sticky-cta-spacer d-lg-none" aria-hidden="true" />
         <div
            className={`pp-sticky-cta d-lg-none${panelVisible ? " is-hidden" : ""}`}
            role="region"
            aria-label="Quick actions"
         >
            <div className="pp-sticky-cta__price">
               <span className="pp-sticky-cta__label">Price</span>
               <span className="pp-sticky-cta__value">{priceLabel}</span>
            </div>
            {hasLead ? (
               <button type="button" className="btn-four pp-sticky-cta__btn" onClick={scrollToPanel}>
                  Request Site Visit
               </button>
            ) : (
               <InquiryButton
                  kind="property"
                  id={propertyId}
                  title={propertyTitle}
                  subtitle={propertyAddress}
                  className="btn-four pp-sticky-cta__btn"
                  label="Send Inquiry"
               />
            )}
         </div>

         <style jsx global>{`
            .pp-sticky-cta {
               position: fixed;
               left: 0;
               right: 0;
               bottom: 0;
               z-index: 1040;
               display: flex;
               align-items: center;
               justify-content: space-between;
               gap: 12px;
               padding: 10px 16px calc(10px + env(safe-area-inset-bottom, 0px));
               background: #fff;
               border-top: 1px solid #f5ede8;
               box-shadow: 0 -8px 24px rgba(20, 20, 10, 0.08);
               transition: transform 0.25s ease;
            }
            .pp-sticky-cta.is-hidden {
               transform: translateY(110%);
               pointer-events: none;
            }
            .pp-sticky-cta__price {
               display: flex;
               flex-direction: column;
               min-width: 0;
               line-height: 1.2;
            }
            .pp-sticky-cta__label {
               font-size: 11px;
               text-transform: uppercase;
               letter-spacing: 0.04em;
               opacity: 0.6;
            }
            .pp-sticky-cta__value {
               font-size: 15px;
               font-weight: 500;
               color: #000;
               overflow: hidden;
               text-overflow: ellipsis;
               white-space: nowrap;
            }
            .pp-sticky-cta__btn {
               flex-shrink: 0;
               justify-content: center;
               white-space: nowrap;
               min-height: 44px;
               padding: 0 18px;
               font-size: 14px;
            }
            .pp-sticky-cta-spacer {
               height: calc(72px + env(safe-area-inset-bottom, 0px));
            }
            /* Keep floating buttons clear of the bar while it is mounted. */
            @media (max-width: 991px) {
               html.pp-has-sticky-cta .property-planet-ai-fab {
                  bottom: calc(84px + env(safe-area-inset-bottom, 0px));
               }
               html.pp-has-sticky-cta .property-planet-ai-panel {
                  bottom: calc(156px + env(safe-area-inset-bottom, 0px));
                  max-height: calc(100vh - 176px);
               }
               html.pp-has-sticky-cta .scroll-top {
                  bottom: calc(84px + env(safe-area-inset-bottom, 0px));
               }
            }
         `}</style>
      </>
   );
};

export default PropertyStickyCta;
