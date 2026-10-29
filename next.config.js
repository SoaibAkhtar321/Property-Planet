/** @type {import('next').NextConfig} */
const nextConfig = {
  // Don't advertise the framework/version in every response.
  poweredByHeader: false,
  images: {
    // SEO/perf fix: this was `unoptimized: true`, which disables Next's
    // entire image pipeline (resizing, WebP/AVIF conversion, responsive
    // srcset) for every property/project photo on the site — the single
    // biggest lever on LCP and page weight for a listings-heavy site.
    // It was set that way because the optimizer depends on the `sharp`
    // binary, which can be missing in some sandboxed/preview hosts.
    // Production is Vercel, which ships `sharp` support natively, so
    // that constraint doesn't apply here.
    //
    // Optimization requires every remote image host to be explicitly
    // allow-listed. All property/project photos are served from Supabase
    // Storage public URLs (see src/lib/projects/queries.ts's
    // projectMediaPublicUrl / resolveMedia and the equivalent property
    // media resolution) — hostname is always `<project-ref>.supabase.co`,
    // so a wildcard on that suffix covers the real, current project
    // without hardcoding one specific ref.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  // SEO fix (Stage 4 — Internal SEO Consistency): /about_us_02 was a
  // template-leftover slug for the site's real, live About page (every
  // internal link now points at the clean /about instead). A permanent
  // redirect keeps any already-indexed/bookmarked/linked-from-elsewhere
  // /about_us_02 URLs resolving instead of 404ing, and passes their
  // link equity on to the new canonical URL.
  // Security audit 2026-10: baseline response headers.
  //  * frame-ancestors / X-Frame-Options: nobody may iframe this site
  //    (clickjacking on login, seller dashboard and admin pages). Pages on
  //    this site embedding Google Maps iframes are unaffected — this
  //    controls who frames *us*, not what we frame.
  //  * nosniff: browsers must not guess a different content type for
  //    uploaded media.
  //  * Permissions-Policy: the site uses none of these browser features,
  //    so any injected script can't either.
  // A full script-src CSP is intentionally not set here yet: the theme
  // relies on inline scripts (theme bootstrap, JSON-LD, Bootstrap/WOW.js),
  // and a CSP that breaks them would need nonce support across the app.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: "frame-ancestors 'none'; base-uri 'self'; object-src 'none'; form-action 'self'" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
        ],
      },
      // Private areas: robots.txt asks crawlers not to visit, and the pages
      // carry a noindex meta tag; this header also covers non-HTML
      // responses and any URL a crawler reaches through an outside link.
      ...["/admin/:path*", "/dashboard/:path*", "/auth/:path*"].map((source) => ({
        source,
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      })),
    ];
  },
  async redirects() {
    return [
      {
        source: "/about_us_02",
        destination: "/about",
        permanent: true,
      },
      // The old static /sell-property "list your property" page was a
      // non-functional prototype (its submit button was disabled) and has
      // been removed. Sellers now use the real, session-aware flow that
      // starts at /seller/login (-> /seller/register -> seller dashboard).
      // Redirected rather than 404'd because the URL was in the sitemap.
      {
        source: "/sell-property",
        destination: "/seller/login",
        permanent: true,
      },
    ];
  },
}

module.exports = nextConfig
