// src/app/robots.ts
//
// Phase 8: no robots.txt existed at all (neither a static file under
// public/ nor this special Next.js file) -- crawlers got Next's default
// (implicitly "allow everything", including /dashboard/** and /admin/**,
// which should never be indexed) and there was nothing pointing them at
// a sitemap.
//
// Domain matches the one already hardcoded in every per-page
// generateMetadata() (see src/app/properties/[slug]/page.tsx,
// src/app/projects/[slug]/page.tsx, etc.) and in the root layout's
// og:url meta tag -- kept as a literal here rather than introducing a
// new env var, for the same reason those call sites do.

import type { MetadataRoute } from "next";

const SITE_URL = "https://propertyplanet.in";

export default function robots(): MetadataRoute.Robots {
   return {
      rules: [
         {
            userAgent: "*",
            allow: "/",
            disallow: [
               "/dashboard",
               "/dashboard/",
               "/admin",
               "/admin/",
               "/auth",
               "/auth/",
               "/seller/login",
               "/seller/register",
            ],
         },
      ],
      sitemap: `${SITE_URL}/sitemap.xml`,
   };
}
