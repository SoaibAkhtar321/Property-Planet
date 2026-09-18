"use client";

import { useEffect } from "react";
import { ToastContainer } from "react-toastify";
import { animationCreate } from "@/utils/utils";
import ScrollToTop from "@/components/common/ScrollToTop";
import PropertyPlanetAIWidget from "@/components/common/PropertyPlanetAIWidget";
import InquiryDialog from "@/components/inquiry/InquiryDialog";

const Wrapper = ({ children }: any) => {
    useEffect(() => {
        // Perf fix (Phase 5): this was a top-level `require("bootstrap/dist/js/bootstrap")`
        // outside the component, which forces the entire Bootstrap JS bundle
        // (collapse/dropdown/modal/offcanvas + Popper) into the initial client
        // bundle and executes it eagerly on every single page load/hydration —
        // a real Total Blocking Time cost on mobile CPUs. Nothing in this
        // codebase calls the Bootstrap JS API programmatically (grep confirms
        // it's all `data-bs-*` attributes); Bootstrap 5's JS wires those up via
        // document-level delegated listeners as soon as it loads, with no
        // DOMContentLoaded race and no per-element init required. So it's safe
        // to defer exactly like wowjs already is below: split into its own
        // chunk, loaded after mount instead of blocking the initial bundle.
        import("bootstrap/dist/js/bootstrap");

        // animation
        const timer = setTimeout(() => {
            animationCreate();
        }, 100);

        return () => clearTimeout(timer);
    }, []);


    return <>
        {children}
        <ScrollToTop />
        {/* PropertyPlanetAIWidget: enabled with sample/reference Q&A only.
            Verification/trust badges are intentionally not rendered here —
            see PropertyPlanetAIWidget.tsx — until this is wired to real
            Supabase property data and a real AI backend. */}
        <PropertyPlanetAIWidget />
        {/* Universal inquiry flow: mounted once here so every "Send Inquiry"
            button on the site (cards, detail pages, units) opens the same
            dialog and writes through the same existing lead actions. */}
        <InquiryDialog />
        <ToastContainer position="top-center" />
    </>;
}

export default Wrapper
