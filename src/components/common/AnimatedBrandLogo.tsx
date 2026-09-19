// src/components/common/AnimatedBrandLogo.tsx
//
// Header logo. The previous version layered an intro video of the OLD logo
// (/assets/video/brand-logo-anim.mp4, not present in the repo) over the
// static logo. That clip can't represent the new artwork, so the header now
// plays a subtle one-time CSS entrance on the new logo instead (see
// _brand-logo.scss; skipped for prefers-reduced-motion). Below 576px the
// permanent icon is shown instead of the full wordmark.

import BrandLogo from "./BrandLogo";

const AnimatedBrandLogo = () => <BrandLogo size="header" animate mobileIcon priority />;

export default AnimatedBrandLogo;
