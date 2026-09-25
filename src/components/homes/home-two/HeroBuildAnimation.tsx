"use client";

import { useEffect, useState } from "react";

/**
 * HeroBuildAnimation
 *
 * Inline SVG "land -> construction -> completed home" hero animation.
 *
 * Design constraints (deliberate):
 *  - No animation library. Zero new dependencies, zero JS at runtime.
 *    Everything is declarative CSS (see public/assets/scss/_hero-build.scss)
 *    and only animates `transform` / `opacity`, so it stays on the compositor
 *    and does not trigger layout/paint thrash above the fold.
 *  - The BASE (un-animated) state of every element is the FINISHED HOUSE.
 *    Keyframes only subtract from that state to replay the build-up. So if
 *    CSS fails, animations are disabled, or the user prefers reduced motion,
 *    the hero degrades gracefully to a clean static completed property.
 *  - Inline SVG => no extra network request, no LCP image, no CLS
 *    (the stage reserves its own aspect ratio).
 */
/**
 * Cinematic hero video (full-bleed background layer).
 *
 * Two art-directed sources, chosen by actual viewport composition rather
 * than a device/orientation label:
 *  - NEXT_PUBLIC_HERO_VIDEO_DESKTOP_URL  (16:9 landscape footage)
 *  - NEXT_PUBLIC_HERO_VIDEO_MOBILE_URL   (9:16 portrait footage)
 * plus one poster per source (…_DESKTOP_POSTER / …_MOBILE_POSTER).
 *
 * Selection is aspect-ratio based, not width-bucketed: cover-crop testing
 * at the real target sizes (360x800 up to 1920x1080, incl. 768x1024 and
 * 820x1180 portrait tablets, and 1024x768 landscape tablet) showed the
 * desktop clip loses its readable plot/road shape when force-cropped to a
 * portrait frame, while the mobile clip still reads cleanly when
 * force-cropped to a landscape frame. So: viewport AR < 1 -> mobile video,
 * AR >= 1 -> desktop video. This naturally covers portrait tablets with the
 * mobile clip and landscape tablets with the desktop clip without treating
 * "tablet" as its own bucket.
 *
 * Exactly one <video> element ever exists in the DOM, and its `src` is only
 * set after that check runs client-side — so only one file is ever
 * requested, never both, and the server-rendered / no-JS / reduced-motion
 * state is the existing SVG sequence (unchanged) acting as a real fallback,
 * not a video with a slow-loading source.
 *
 * Resolving order (fixes the old-hero flash): `hasVideoSources` is derived
 * from build-time-inlined env vars, so server and client agree on it from
 * the very first paint -- no waiting on JS for that part. The *aspect-ratio*
 * pick (desktop vs. mobile) and the reduced-motion check DO need the
 * client, though, so while those are still resolving we show a poster-only
 * placeholder (desktop/mobile poster picked by a plain CSS media query, no
 * JS needed) instead of the animated SVG house. That SVG is reserved for
 * the one case it actually belongs to: no video configured at all. This
 * keeps the animation from ever being the thing that flashes in front of
 * an about-to-appear video.
 */
const HERO_VIDEO_DESKTOP_URL = process.env.NEXT_PUBLIC_HERO_VIDEO_DESKTOP_URL;
const HERO_VIDEO_MOBILE_URL = process.env.NEXT_PUBLIC_HERO_VIDEO_MOBILE_URL;
const HERO_VIDEO_DESKTOP_POSTER = process.env.NEXT_PUBLIC_HERO_VIDEO_DESKTOP_POSTER;
const HERO_VIDEO_MOBILE_POSTER = process.env.NEXT_PUBLIC_HERO_VIDEO_MOBILE_POSTER;

type HeroVideoChoice = "desktop" | "mobile" | null;

const HeroBuildAnimation = () => {
   // Reduced motion has to be answered in JS for the media variant: CSS
   // cannot stop a video from autoplaying. When the preference is set, the
   // poster frame is shown and playback is left to the user.
   const [reducedMotion, setReducedMotion] = useState(false);
   // null until the client has measured the viewport, so the server-
   // rendered markup never guesses a source (and never ships either video
   // URL into markup that could be prefetched).
   const [videoChoice, setVideoChoice] = useState<HeroVideoChoice>(null);
   // Flips true once the effect below has resolved both the reduced-motion
   // preference and the viewport aspect ratio. Gates which "resolved" state
   // (video vs. animated SVG) we're allowed to show -- see hasVideoSources
   // branch below for what renders before that.
   const [resolved, setResolved] = useState(false);

   useEffect(() => {
      const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
      setReducedMotion(motionQuery.matches);
      const onMotionChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
      motionQuery.addEventListener("change", onMotionChange);

      // aspect-ratio: 1/1 -> viewport width/height >= 1 (landscape or square)
      const arQuery = window.matchMedia("(min-aspect-ratio: 1/1)");
      const applyChoice = (isLandscape: boolean) =>
         setVideoChoice(isLandscape ? "desktop" : "mobile");
      applyChoice(arQuery.matches);
      const onArChange = (e: MediaQueryListEvent) => applyChoice(e.matches);
      arQuery.addEventListener("change", onArChange);

      setResolved(true);

      return () => {
         motionQuery.removeEventListener("change", onMotionChange);
         arQuery.removeEventListener("change", onArChange);
      };
   }, []);

   const hasVideoSources = Boolean(HERO_VIDEO_DESKTOP_URL && HERO_VIDEO_MOBILE_URL);

   if (hasVideoSources) {
      if (resolved && videoChoice && !reducedMotion) {
         const src = videoChoice === "desktop" ? HERO_VIDEO_DESKTOP_URL : HERO_VIDEO_MOBILE_URL;
         const poster =
            videoChoice === "desktop" ? HERO_VIDEO_DESKTOP_POSTER : HERO_VIDEO_MOBILE_POSTER;

         return (
            <div className="hero-video-bg" aria-hidden="true">
               <video
                  key={videoChoice}
                  className="hero-video-bg__video"
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="auto"
                  poster={poster}
               >
                  <source src={src} type="video/mp4" />
               </video>
            </div>
         );
      }

      // Covers two cases: (a) still resolving on the client -- viewport
      // aspect ratio and reduced-motion aren't known yet, so we can't pick
      // desktop vs. mobile video, and (b) resolved as reduced-motion, which
      // this hero treats the same way -- a static frame, not the animated
      // SVG build sequence. Either way this is a plain CSS-media-query
      // swap between the two existing poster images, so it's correct on
      // the very first paint with zero JS and zero extra network request
      // (browsers only fetch the poster that's actually displayed).
      return (
         <div className="hero-video-bg hero-video-bg--poster" aria-hidden="true">
            {HERO_VIDEO_DESKTOP_POSTER && (
               <div
                  className="hero-video-bg__poster hero-video-bg__poster--desktop"
                  style={{ backgroundImage: `url(${HERO_VIDEO_DESKTOP_POSTER})` }}
               />
            )}
            {HERO_VIDEO_MOBILE_POSTER && (
               <div
                  className="hero-video-bg__poster hero-video-bg__poster--mobile"
                  style={{ backgroundImage: `url(${HERO_VIDEO_MOBILE_POSTER})` }}
               />
            )}
         </div>
      );
   }

   return (
      <div className="hb-stage hb-animate shapes illustration" aria-hidden="true">
         <svg
            className="hb-svg"
            viewBox="0 0 900 620"
            preserveAspectRatio="xMidYMax meet"
            xmlns="http://www.w3.org/2000/svg"
            role="img"
            focusable="false"
         >
            <defs>
               <linearGradient id="hbWall" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FFFFFF" />
                  <stop offset="100%" stopColor="#FFF1E8" />
               </linearGradient>
               <linearGradient id="hbWallSide" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#F5EDE8" />
                  <stop offset="100%" stopColor="#E7DAD1" />
               </linearGradient>
               <linearGradient id="hbRoof" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#23505F" />
                  <stop offset="100%" stopColor="#0F2A37" />
               </linearGradient>
               <linearGradient id="hbRoofSide" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#173C48" />
                  <stop offset="100%" stopColor="#0A1F29" />
               </linearGradient>
               <linearGradient id="hbGlass" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#CFF3FB" />
                  <stop offset="100%" stopColor="#7FD7E8" />
               </linearGradient>
               <linearGradient id="hbGround" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#E9F6F0" />
                  <stop offset="100%" stopColor="#D6EBE4" />
               </linearGradient>
            </defs>

            {/* ---------------- CAMERA GROUP (scene fade + slow push/pull) --------------- */}
            <g className="hb-scene">

               {/* Scene 1 context: emerging Hyderabad / Future City skyline.
                   Low-contrast so it never competes with the headline. */}
               <g className="hb-skyline">
                  <rect x="18" y="300" width="46" height="150" rx="3" />
                  <rect x="72" y="262" width="34" height="188" rx="3" />
                  <rect x="114" y="318" width="52" height="132" rx="3" />
                  <rect x="176" y="238" width="30" height="212" rx="3" />
                  <rect x="214" y="296" width="44" height="154" rx="3" />
                  <rect x="640" y="284" width="38" height="166" rx="3" />
                  <rect x="686" y="246" width="30" height="204" rx="3" />
                  <rect x="724" y="308" width="54" height="142" rx="3" />
                  <rect x="786" y="272" width="34" height="178" rx="3" />
                  <rect x="828" y="322" width="48" height="128" rx="3" />
                  {/* hint of a landmark tower so it reads "city", not "countryside" */}
                  <path d="M196 238 L191 214 L196 200 L201 214 Z" />
               </g>

               {/* Roadway + ground plane */}
               <g className="hb-ground">
                  <rect x="0" y="446" width="900" height="10" fill="#0F2A37" opacity="0.12" />
                  <path d="M0 456 H900 V620 H0 Z" fill="url(#hbGround)" />
                  <path d="M120 456 L40 620 H120 L180 456 Z" fill="#0F2A37" opacity="0.06" />
                  <path
                     d="M86 560 h34 M60 604 h34"
                     stroke="#FFFFFF"
                     strokeWidth="5"
                     strokeLinecap="round"
                     opacity="0.7"
                  />
               </g>

               {/* Scene 1: the surveyed plot. Visible from frame one. */}
               <g className="hb-plot">
                  <path
                     className="hb-plot__line"
                     d="M300 474 L742 474 L806 588 L246 588 Z"
                     fill="#1FAA59"
                     fillOpacity="0.05"
                     stroke="#1FAA59"
                     strokeWidth="3"
                     strokeDasharray="14 10"
                     strokeLinejoin="round"
                  />
                  <g className="hb-plot__stakes" fill="#1FAA59">
                     <rect x="297" y="458" width="4" height="18" rx="2" />
                     <rect x="739" y="458" width="4" height="18" rx="2" />
                     <rect x="243" y="572" width="4" height="18" rx="2" />
                     <rect x="803" y="572" width="4" height="18" rx="2" />
                  </g>
               </g>

               {/* --------------------------- CONSTRUCTION ---------------------------- */}

               {/* Tower crane: present only while the structure goes up. */}
               <g className="hb-crane" stroke="#0F2A37" strokeWidth="5" strokeLinecap="round" fill="none">
                  <path d="M646 486 V180" />
                  <path d="M646 196 H820" />
                  <path d="M646 196 H586" />
                  <path d="M646 168 L646 196" strokeWidth="4" />
                  <path d="M646 168 L790 196 M646 168 L596 196" strokeWidth="3" opacity="0.7" />
                  <path className="hb-crane__cable" d="M744 198 V300" strokeWidth="2" />
                  <rect
                     className="hb-crane__load"
                     x="730"
                     y="300"
                     width="28"
                     height="18"
                     rx="3"
                     fill="#1FAA59"
                     stroke="none"
                  />
               </g>

               {/* Foundation slab */}
               <g className="hb-foundation">
                  <path d="M318 474 L724 474 L772 562 L272 562 Z" fill="#CBBFB6" />
                  <path d="M318 474 L724 474 L716 486 L326 486 Z" fill="#B7A99F" />
               </g>

               {/* Structural columns (grow from the slab) */}
               <g className="hb-columns" fill="#A99C92">
                  <rect className="hb-col" x="352" y="306" width="15" height="172" rx="2" />
                  <rect className="hb-col" x="470" y="306" width="15" height="172" rx="2" />
                  <rect className="hb-col" x="588" y="306" width="15" height="172" rx="2" />
                  <rect className="hb-col" x="676" y="306" width="15" height="172" rx="2" />
               </g>

               {/* Main volume: front wall, side wall, upper floor */}
               <g className="hb-walls">
                  <path className="hb-wall hb-wall--front" d="M346 306 H626 V478 H346 Z" fill="url(#hbWall)" />
                  <path className="hb-wall hb-wall--side" d="M626 306 L706 286 V458 L626 478 Z" fill="url(#hbWallSide)" />
                  <path className="hb-wall hb-wall--upper" d="M346 246 H626 V306 H346 Z" fill="url(#hbWall)" />
                  <path className="hb-wall hb-wall--upperSide" d="M626 246 L706 226 V286 L626 306 Z" fill="url(#hbWallSide)" />
                  <path className="hb-floorline" d="M346 306 H626 L706 286" stroke="#0F2A37" strokeOpacity="0.14" strokeWidth="3" fill="none" />
               </g>

               {/* Roof — hip roof drawn as two separate sloped panels that
                   share the ridge edge (486,178)-(566,158). The previous
                   version was a single 6-point path where the ridge point
                   was plotted out of order, so the fill crossed over itself
                   ("bowtie") at the top instead of forming clean slopes. */}
               <g className="hb-roof">
                  <path d="M330 248 L486 178 L566 158 L410 228 Z" fill="url(#hbRoof)" />
                  <path d="M486 178 L642 248 L722 228 L566 158 Z" fill="url(#hbRoofSide)" />
                  <path d="M330 248 H642 L722 228" stroke="#0F2A37" strokeWidth="6" fill="none" strokeLinejoin="round" />
               </g>

               {/* Openings: glazing + entrance */}
               <g className="hb-openings">
                  <rect className="hb-open" x="376" y="338" width="86" height="96" rx="4" fill="url(#hbGlass)" />
                  <rect className="hb-open" x="482" y="338" width="60" height="96" rx="4" fill="url(#hbGlass)" />
                  <rect className="hb-open" x="376" y="264" width="60" height="30" rx="4" fill="url(#hbGlass)" />
                  <rect className="hb-open" x="452" y="264" width="60" height="30" rx="4" fill="url(#hbGlass)" />
                  <rect className="hb-open" x="528" y="264" width="60" height="30" rx="4" fill="url(#hbGlass)" />
                  <path className="hb-open" d="M648 322 L692 311 V430 L648 441 Z" fill="url(#hbGlass)" />
                  <rect className="hb-open hb-door" x="562" y="386" width="48" height="92" rx="3" fill="#23505F" />
                  <circle className="hb-open" cx="602" cy="432" r="3" fill="#1FAA59" />
               </g>

               {/* Exterior finishing + landscaping + entrance lighting */}
               <g className="hb-finish">
                  <path d="M346 478 H626 V488 H346 Z" fill="#0F2A37" opacity="0.10" />
                  <rect x="346" y="243" width="280" height="6" rx="2" fill="#1FAA59" opacity="0.9" />
                  <path d="M546 478 h80 v10 h-92 z" fill="#E7DAD1" />
                  <path d="M534 488 h104 v10 h-116 z" fill="#DCCEC5" />
                  {/* warm light spill from the entrance */}
                  <path d="M586 478 L640 560 L520 560 Z" fill="#1FAA59" opacity="0.10" />
                  {/* landscaping */}
                  <g className="hb-plants">
                     <path d="M300 478 q18 -46 36 0 z" fill="#00B579" opacity="0.85" />
                     <rect x="316" y="470" width="4" height="16" fill="#0F2A37" opacity="0.5" />
                     <path d="M728 470 q22 -56 44 0 z" fill="#00B579" opacity="0.8" />
                     <rect x="748" y="462" width="5" height="22" fill="#0F2A37" opacity="0.5" />
                     <ellipse cx="686" cy="498" rx="26" ry="8" fill="#00B579" opacity="0.28" />
                     <ellipse cx="288" cy="506" rx="30" ry="9" fill="#00B579" opacity="0.28" />
                  </g>
               </g>
            </g>
         </svg>
      </div>
   )
}

export default HeroBuildAnimation