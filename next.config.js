/** @type {import('next').NextConfig} */
const nextConfig = {
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
