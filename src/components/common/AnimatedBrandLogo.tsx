// src/components/common/AnimatedBrandLogo.tsx
//
// Header logo: plays the Property Planet intro clip on a continuous,
// silent loop -- it never stops and never needs a click. Falls back to
// the static BrandLogo SVG only while the video hasn't started playing
// yet (or can't play at all, e.g. prefers-reduced-motion, or the file
// fails to load), so there's never a blank gap in the header.
//
// Always renders BrandLogo underneath so there is a) no layout shift and
// b) a single accessible name ("Property Planet") whether or not the
// video is showing -- the video itself is aria-hidden.

"use client"

import { useEffect, useState } from "react"
import BrandLogo from "./BrandLogo"

const AnimatedBrandLogo = () => {
   const [canAnimate, setCanAnimate] = useState(false);
   const [videoPlaying, setVideoPlaying] = useState(false);
   const [videoFailed, setVideoFailed] = useState(false);

   useEffect(() => {
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      const applyPreference = () => setCanAnimate(!mq.matches);
      applyPreference();
      mq.addEventListener("change", applyPreference);
      return () => mq.removeEventListener("change", applyPreference);
   }, []);

   const showVideo = canAnimate && !videoFailed;
   const showFallback = !showVideo || !videoPlaying;

   return (
      <span className="brand-logo-video-wrap">
         <BrandLogo
            animate={false}
            className={`brand-logo-video-fallback${showFallback ? "" : " is-hidden"}`}
         />
         {showVideo && (
            <video
               className={`brand-logo-video${videoPlaying ? "" : " is-hidden"}`}
               autoPlay
               loop
               muted
               playsInline
               preload="auto"
               aria-hidden="true"
               onPlaying={() => setVideoPlaying(true)}
               onError={() => setVideoFailed(true)}
            >
               <source src="/assets/video/brand-logo-anim.mp4" type="video/mp4" />
            </video>
         )}
      </span>
   );
};

export default AnimatedBrandLogo;
