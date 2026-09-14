// src/components/common/AnimatedBrandLogo.tsx
//
// Header logo: plays the cropped Property Planet intro clip once, muted,
// then settles into the static BrandLogo SVG for its resting state.
// Falls back straight to the static SVG (no video ever requested) when
// the user has prefers-reduced-motion set.
//
// Always renders BrandLogo underneath so there is a) no layout shift and
// b) a single accessible name ("Property Planet") whether or not the
// video is showing -- the video itself is aria-hidden.

"use client"

import { useEffect, useRef, useState } from "react"
import BrandLogo from "./BrandLogo"

const AnimatedBrandLogo = () => {
   const [canAnimate, setCanAnimate] = useState(false);
   const [ended, setEnded] = useState(false);
   const videoRef = useRef<HTMLVideoElement>(null);

   useEffect(() => {
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      const applyPreference = () => setCanAnimate(!mq.matches);
      applyPreference();
      mq.addEventListener("change", applyPreference);
      return () => mq.removeEventListener("change", applyPreference);
   }, []);

   const showVideo = canAnimate && !ended;

   return (
      <span className="brand-logo-video-wrap">
         <BrandLogo
            animate={false}
            className={`brand-logo-video-fallback${showVideo ? " is-hidden" : ""}`}
         />
         {canAnimate && (
            <video
               ref={videoRef}
               className={`brand-logo-video${ended ? " is-hidden" : ""}`}
               autoPlay
               muted
               playsInline
               preload="auto"
               aria-hidden="true"
               onEnded={() => setEnded(true)}
            >
               <source src="/assets/video/brand-logo-anim.webm" type="video/webm" />
               <source src="/assets/video/brand-logo-anim.mp4" type="video/mp4" />
            </video>
         )}
      </span>
   );
};

export default AnimatedBrandLogo;
