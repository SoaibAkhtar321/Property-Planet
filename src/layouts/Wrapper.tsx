"use client";

import { useEffect } from "react";
import { ToastContainer } from "react-toastify";
import { animationCreate } from "@/utils/utils";
import ScrollToTop from "@/components/common/ScrollToTop";
import PropertyPlanetAIWidget from "@/components/common/PropertyPlanetAIWidget";
import InquiryDialog from "@/components/inquiry/InquiryDialog";

if (typeof window !== "undefined") {
    require("bootstrap/dist/js/bootstrap");
}

const Wrapper = ({ children }: any) => {
    useEffect(() => {
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
