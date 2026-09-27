// src/components/common/BrandLogo.tsx
//
// Single source of truth for the Property Planet logo in the UI.
//
//   Full logo (light backgrounds)  -> /assets/images/logo/property-planet-logo-light.svg
//   Full logo (dark backgrounds)   -> /assets/images/logo/property-planet-logo-dark.svg
//   Compact mark / mobile icon     -> /assets/images/logo/property-planet-mark.svg
//
// Theme-aware: when `variant` is omitted, light/dark SVGs swap via the
// existing `data-theme` attribute (set by ThemeToggle + layout script).
// When `variant` is provided (e.g. footer with fixed dark-bg), that
// variant is forced and theme switching is skipped for this instance.

interface BrandLogoProps {
   /** Play a subtle one-time entrance animation. Disabled by prefers-reduced-motion. */
   animate?: boolean;
   /**
    * Force a specific variant.
    * - "light" = dark navy wordmark (for light surfaces)
    * - "dark"  = white wordmark (for dark surfaces)
    * - omit    = follow site theme via data-theme
    */
   variant?: "light" | "dark";
   /** Height preset; actual pixel heights live in _brand-logo.scss. */
   size?: "header" | "footer" | "menu";
   /** Between 992–1359px show the symbol-only mark instead of the full wordmark. */
   mobileIcon?: boolean;
   priority?: boolean;
   className?: string;
}

const LIGHT_SRC = "/assets/images/logo/property-planet-logo-light.svg";
const DARK_SRC = "/assets/images/logo/property-planet-logo-dark.svg";
const MARK_SRC = "/assets/images/logo/property-planet-mark.svg";

const BrandLogo = ({
   animate = false,
   variant,
   size = "menu",
   mobileIcon = false,
   priority = false,
   className = "",
}: BrandLogoProps) => {
   const cls = [
      "brand-logo",
      `brand-logo--${size}`,
      animate ? "brand-logo--animate" : "",
      mobileIcon ? "brand-logo--icon-mobile" : "",
      variant ? `brand-logo--force-${variant}` : "brand-logo--theme",
      className,
   ]
      .filter(Boolean)
      .join(" ");

   return (
      <span className={cls}>
         {/* Full wordmark — light (navy text) */}
         {(variant === undefined || variant === "light") && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
               className="brand-logo__full brand-logo__full--light"
               src={LIGHT_SRC}
               alt="Property Planet"
               width={260}
               height={63}
               decoding="async"
               {...(priority ? { fetchPriority: "high" as const } : {})}
            />
         )}
         {/* Full wordmark — dark (white text) */}
         {(variant === undefined || variant === "dark") && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
               className="brand-logo__full brand-logo__full--dark"
               src={DARK_SRC}
               alt="Property Planet"
               width={260}
               height={63}
               decoding="async"
               {...(priority ? { fetchPriority: "high" as const } : {})}
            />
         )}
         {mobileIcon && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
               className="brand-logo__icon"
               src={MARK_SRC}
               alt="Property Planet"
               width={64}
               height={64}
               decoding="async"
            />
         )}
      </span>
   );
};

export default BrandLogo;
