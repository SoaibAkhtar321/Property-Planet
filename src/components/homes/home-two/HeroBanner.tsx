"use client"
import Image from "next/image"
import Link from "next/link";
import DropdownTwo from "@/components/search-dropdown/home-dropdown/DropdownTwo";
import { openPropertyPlanetAI } from "@/utils/propertyPlanetAIBus";

import HeroBuildAnimation from "./HeroBuildAnimation";

import titleShape from "@/assets/images/shape/shape_11.svg"

// Phase 20: the old hero composition is removed, not layered over. Gone:
// the ils_03.png illustration, the shape_12/badge_01 decorations and the
// line-bg grid overlay — all three belonged to the previous hero and
// competed with the animation for the same corner of the viewport. What
// remains is one composition: headline, supporting line, primary CTA, the
// AI CTA, the search panel, and the build animation bled into the
// bottom-right behind a readability scrim (see _hero-build.scss).
//
// Phase 21: when both hero video sources are configured, HeroBuildAnimation
// renders a full-bleed <video> background instead of the boxed SVG. The
// mobile/tablet CSS in _hero-build.scss needs to know which mode is active
// (full-bleed video vs. the original stacked/no-visual layout) purely from
// markup -- `has-hero-video` is that signal, gated on the exact same env
// vars HeroBuildAnimation itself checks, so the two never disagree.
const HAS_HERO_VIDEO = Boolean(
   process.env.NEXT_PUBLIC_HERO_VIDEO_DESKTOP_URL && process.env.NEXT_PUBLIC_HERO_VIDEO_MOBILE_URL
);

const HeroBanner = () => {

   return (
      <>
         <div className={`hero-banner-two z-1 position-relative${HAS_HERO_VIDEO ? " has-hero-video" : ""}`}>
            <div className="container">
               <div className="position-relative pt-200 md-pt-150 pb-130 xl-pb-100">
                  <div className="row">
                     <div className="col-xxl-9 col-xl-8 col-lg-9 col-md-10">
                        <h1 className="hero-heading font-garamond wow fadeInUp">The next city is being built <span><Image src={titleShape} alt="" className="lazy-img icon d-inline-block" /></span></h1>
                        <p className="fs-24 color-dark pt-35 md-pt-30 pb-35 mb-pb-20 wow fadeInUp" data-wow-delay="0.1s">Discover curated land, plots, villas, apartments and commercial opportunities across Hyderabad&apos;s emerging South-East growth corridors — guided by AI and backed by human expertise.</p>
                        <div className="d-inline-flex align-items-center flex-wrap hero-cta-group">
                           <Link href="/properties" className="btn-seven mb-20 me-4 me-xxl5"><span>Explore Properties</span> <i className="bi bi-arrow-up-right"></i></Link>
                           <button
                              type="button"
                              onClick={() => openPropertyPlanetAI()}
                              style={{ cursor: "pointer" }}
                              className="ai-assistant-cta tran3s d-flex align-items-center mb-20 border-0"
                           >
                              <span className="ai-assistant-cta__icon">
                                 <i className="fa-light fa-sparkles"></i>
                                 <span className="ai-assistant-cta__tag">AI</span>
                              </span>
                              <span className="ai-assistant-cta__text text-start">
                                 <span className="ai-assistant-cta__eyebrow">Ask</span>
                                 <strong className="ai-assistant-cta__title">Property Planet AI</strong>
                              </span>
                           </button>
                        </div>
                     </div>
                  </div>

                  <div className="row">
                     <div className="col-xxl-9 col-xl-8 col-lg-9 col-md-10">
                        <DropdownTwo />
                     </div>
                  </div>
               </div>
            </div>
            <HeroBuildAnimation />
         </div>
      </>
   )
}

export default HeroBanner
