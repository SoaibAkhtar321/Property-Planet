// src/components/common/BrandLogo.tsx
//
// Reusable Property Planet logo. Inline SVG so individual groups (icon,
// orbit, wordmark) can be targeted by the "Planet Orbit + Establish"
// entrance animation in public/assets/scss/_brand-logo.scss.
//
// Artwork is copied verbatim from the existing static logo files -- same
// shapes, positions, and brand colors, no redesign or geometry changes.
// When animation finishes (or is skipped), the rendered result is
// pixel-identical to the static SVGs they replace:
//   variant="light" -> public/assets/images/logo/logo_02.svg (header default)
//   variant="dark"  -> public/assets/images/logo/logo_03.svg (dark-bg footer)
//
// Usage:
//   <BrandLogo />                          header: entrance once on mount
//   <BrandLogo variant="dark" animate={false} /> footer: static, dark-bg colors

interface BrandLogoProps {
   /** Play the entrance animation on mount. Defaults to true. Pass false
    *  for static placements (e.g. the footer) that should never animate. */
   animate?: boolean;
   /** Color scheme matching the background it sits on. "light" mirrors
    *  logo_02.svg (light bg). "dark" mirrors logo_03.svg (dark-bg footer). */
   variant?: "light" | "dark";
   className?: string;
}

const PALETTES = {
   light: { ring: "#157567", ringOpacity: undefined as number | undefined, accent: "#FF6725", fill: "#e7f4f1", houseBody: "#157567", houseWindow: "#e7f4f1", houseWindowStroke: undefined as string | undefined, wordPrimary: "#157567" },
   dark: { ring: "#ffffff", ringOpacity: 0.9, accent: "#FF8B5C", fill: "none", houseBody: "#ffffff", houseWindow: "none", houseWindowStroke: "#FF8B5C", wordPrimary: "#ffffff" },
};

const BrandLogo = ({ animate = true, variant = "light", className = "" }: BrandLogoProps) => {
   const p = PALETTES[variant];
   return (
      <svg
         width="380"
         height="95"
         viewBox="0 0 440 110"
         xmlns="http://www.w3.org/2000/svg"
         className={`brand-logo ${animate ? "brand-logo--animate" : ""} ${className}`}
         role="img"
         aria-label="Property Planet"
      >
         <g transform="translate(10,5)">
            <g className="brand-logo__icon">
               <circle cx="50" cy="50" r="44" fill={p.fill} />
               <circle cx="50" cy="50" r="44" fill="none" stroke={p.ring} strokeWidth={5} opacity={p.ringOpacity} />
            </g>

            <g className="brand-logo__orbit">
               <ellipse
                  cx="50" cy="50" rx="52" ry="18"
                  fill="none" stroke={p.accent} strokeWidth={5.5}
                  transform="rotate(-18 50 50)"
               />
               <circle cx="96" cy="41" r="5.5" fill={p.accent} transform="rotate(-18 50 50)" />
            </g>

            {/* Restrained one-pass sweep along the orbit ring -- a short
                arc segment that fades in, travels, and fades out once.
                Not a looping/continuous effect. */}
            <ellipse
               cx="50" cy="50" rx="52" ry="18"
               fill="none" stroke={p.accent} strokeWidth={5.5}
               strokeLinecap="round"
               transform="rotate(-18 50 50)"
               pathLength={100}
               className="brand-logo__sweep"
            />

            <g className="brand-logo__icon">
               <polygon points="50,22 80,50 20,50" fill={p.accent} />
               <rect x="28" y="50" width="44" height="34" fill={p.houseBody} />
               <rect x="44" y="62" width="14" height="22" fill={p.houseWindow} stroke={p.houseWindowStroke} strokeWidth={p.houseWindowStroke ? 2 : undefined} />
            </g>
         </g>
         <g className="brand-logo__word" fontFamily="Arial, Helvetica, sans-serif" fontWeight={800}>
            <text x="125" y="48" fontSize="34">
               <tspan fill={p.wordPrimary}>PROPER</tspan><tspan fill={p.accent}>ty</tspan>
            </text>
            <text x="125" y="86" fontSize="34">
               <tspan fill={p.wordPrimary}>PLAN</tspan><tspan fill={p.accent}>et</tspan>
            </text>
         </g>
      </svg>
   );
};

export default BrandLogo;
