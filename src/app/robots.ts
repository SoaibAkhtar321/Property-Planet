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
//
// SEO fix (Section 35 -- AI / Search Discoverability): the "*" rule
// below already allowed every crawler, AI answer-engine bots included --
// nothing was blocking them. Naming the major ones explicitly here (same
// allow/disallow as everyone else -- no special treatment, no content
// gate) makes that intentional rather than incidental, so a future
// blanket "block AI scrapers" change doesn't silently catch these too.
// Paired with /llms.txt for a plain-text summary these systems can read
// alongside the sitemap.

import type { MetadataRoute } from "next";

const SITE_URL = "https://propertyplanet.in";

const PUBLIC_DISALLOW = ["/dashboard", "/dashboard/", "/admin", "/admin/", "/auth", "/auth/", "/seller/login", "/seller/register"];

const AI_CRAWLER_AGENTS = [
   "GPTBot",
   "ChatGPT-User",
   "OAI-SearchBot",
   "ClaudeBot",
   "Claude-Web",
   "Google-Extended",
   "PerplexityBot",
   "Amazonbot",
   "Applebot-Extended",
];

export default function robots(): MetadataRoute.Robots {
   return {
      rules: [
         {
            userAgent: "*",
            allow: "/",
            disallow: PUBLIC_DISALLOW,
         },
         ...AI_CRAWLER_AGENTS.map((userAgent) => ({
            userAgent,
            allow: "/",
            disallow: PUBLIC_DISALLOW,
         })),
      ],
      sitemap: `${SITE_URL}/sitemap.xml`,
   };
}
