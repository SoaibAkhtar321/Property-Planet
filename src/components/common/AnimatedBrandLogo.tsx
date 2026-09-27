// src/components/common/AnimatedBrandLogo.tsx
//
// Header logo. Plays a subtle one-time CSS entrance on the SVG logo
// (see _brand-logo.scss; skipped for prefers-reduced-motion).
// Between 992–1359px the compact mark is shown instead of the full wordmark.

import BrandLogo from "./BrandLogo";

const AnimatedBrandLogo = () => (
   <BrandLogo size="header" animate mobileIcon priority />
);

export default AnimatedBrandLogo;
