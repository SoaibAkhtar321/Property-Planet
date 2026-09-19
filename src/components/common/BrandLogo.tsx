// src/components/common/BrandLogo.tsx
//
// Single source of truth for the Property Planet logo in the UI.
//
//   Full logo (symbol + wordmark)  -> public/assets/images/logo/property-planet-logo.png
//   Full logo for dark backgrounds -> public/assets/images/logo/property-planet-logo-dark-bg.png
//   Permanent symbol-only icon     -> public/assets/images/logo/property-planet-icon.png
//
// The icon is the same file used for the favicon (see src/app/layout.tsx)
// and never changes between wordmark colour variants.
//
// Usage:
//   <BrandLogo size="header" mobileIcon />          header (icon-only < 576px)
//   <BrandLogo size="footer" variant="dark" />      footer on a dark background
//   <BrandLogo size="menu" />                       drawers / sidebars

import Image from "next/image";
import fullLight from "@/assets/images/logo/property-planet-logo.png";
import fullDark from "@/assets/images/logo/property-planet-logo-dark-bg.png";
import icon from "@/assets/images/logo/property-planet-icon.png";

interface BrandLogoProps {
   /** Play a subtle one-time entrance animation. Disabled by prefers-reduced-motion. */
   animate?: boolean;
   /** "light" = for light backgrounds, "dark" = for dark backgrounds. */
   variant?: "light" | "dark";
   /** Height preset; actual pixel heights live in _brand-logo.scss. */
   size?: "header" | "footer" | "menu";
   /** Below 576px show the symbol-only icon instead of the full wordmark. */
   mobileIcon?: boolean;
   priority?: boolean;
   className?: string;
}

const BrandLogo = ({
   animate = false,
   variant = "light",
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
      className,
   ].filter(Boolean).join(" ");

   return (
      <span className={cls}>
         <Image
            className="brand-logo__full"
            src={variant === "dark" ? fullDark : fullLight}
            alt="Property Planet"
            sizes="260px"
            priority={priority}
         />
         {mobileIcon && (
            <Image className="brand-logo__icon" src={icon} alt="Property Planet" sizes="64px" />
         )}
      </span>
   );
};

export default BrandLogo;
