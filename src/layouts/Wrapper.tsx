"use client";

import { useEffect } from "react";
import { ToastContainer } from "react-toastify";
import { animationCreate } from "@/utils/utils";
import ScrollToTop from "@/components/common/ScrollToTop";
// TODO(ai-widget): PropertyPlanetAIWidget is disabled — its current dataset
// (src/data/home-data/PropertyData.ts via src/utils/propertyPlanetAIEngine.ts)
// is static template/demo data with fabricated verification status, trust
// scores, and prices. Do not re-enable until it is wired to real Supabase
// property/project data. Component and data files are intentionally left
// in place for that future work.
// import PropertyPlanetAIWidget from "@/components/common/PropertyPlanetAIWidget";

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
        {/* PropertyPlanetAIWidget disabled — see TODO(ai-widget) above */}
        <ToastContainer position="top-center" />
    </>;
}

export default Wrapper
