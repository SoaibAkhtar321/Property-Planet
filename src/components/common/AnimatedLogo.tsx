// src/components/common/AnimatedLogo.tsx
//
// Advanced, choreographed version of the AnimatedLogo drop-in replacement
// for public/assets/images/logo/logo_02.svg. Same shapes/colors/positions
// as the original static file -- this is not a redesign, it's the same
// mark performing a one-time entrance sequence on mount, then settling
// into a subtle idle state:
//
//   0.00s  outer circle fades/scales in
//   0.15s  orbit ring "draws" itself on (stroke animates from 0% to 100%)
//   0.60s  wordmark letters begin cascading in, staggered
//   0.90s  orbit's small dot fades in once the ring has finished drawing
//   0.35s  house drops in from above with a small bounce
//   ~1.05s intro finishes; ring settles into a slow continuous spin,
//          house settles into a soft heartbeat pulse, and a faint orange
//          "brand pulse" ring breathes outward around the mark
//
// All keyframes/timing live in public/assets/scss/_animation.scss under
// the .animated-logo block -- see that file for the exact values.

const AnimatedLogo = () => {
   return (
      <svg
         width="380"
         height="95"
         viewBox="0 0 440 110"
         xmlns="http://www.w3.org/2000/svg"
         className="animated-logo"
         role="img"
         aria-label="Property Planet"
      >
         <g transform="translate(10,5)">
            {/* Soft brand-pulse ring: invisible during the intro, breathes
                outward gently once idle (see .logo-brand-pulse in scss). */}
            <circle cx="50" cy="50" r="44" fill="none" stroke="#FF6725" strokeWidth={2} className="logo-brand-pulse" style={{ transformOrigin: "50px 50px" }} />

            <g className="logo-circle-in" style={{ transformOrigin: "50px 50px" }}>
               <circle cx="50" cy="50" r="44" fill="#e7f4f1" />
               <circle cx="50" cy="50" r="44" fill="none" stroke="#157567" strokeWidth={5} />
            </g>

            {/* Continuous spin wrapper -- only starts once the ring has
                finished drawing itself on (see animation-delay in scss). */}
            <g className="logo-orbit-spin" style={{ transformOrigin: "50px 50px" }}>
               <ellipse
                  cx="50" cy="50" rx="52" ry="18"
                  fill="none" stroke="#FF6725" strokeWidth={5.5}
                  transform="rotate(-18 50 50)"
                  pathLength={100}
                  className="logo-orbit-draw"
               />
               <circle cx="96" cy="41" r="5.5" fill="#FF6725" transform="rotate(-18 50 50)" className="logo-orbit-dot" />
            </g>

            <g className="logo-house" style={{ transformOrigin: "50px 50px" }}>
               <polygon points="50,22 80,50 20,50" fill="#FF6725" />
               <rect x="28" y="50" width="44" height="34" fill="#157567" />
               <rect x="44" y="62" width="14" height="22" fill="#e7f4f1" />
            </g>
         </g>
         <g fontFamily="Arial, Helvetica, sans-serif" fontWeight={800}>
            <text x="125" y="48" fontSize="34">
               <tspan className="logo-word-in logo-word-in--1" fill="#157567">PROPER</tspan>
               <tspan className="logo-word-in logo-word-in--2" fill="#FF6725">ty</tspan>
            </text>
            <text x="125" y="86" fontSize="34">
               <tspan className="logo-word-in logo-word-in--3" fill="#157567">PLAN</tspan>
               <tspan className="logo-word-in logo-word-in--4" fill="#FF6725">et</tspan>
            </text>
         </g>
      </svg>
   );
};

export default AnimatedLogo;
