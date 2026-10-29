// src/app/sitemap.ts
//
// Phase 8: no sitemap existed at all. This one is built only from real,
// already-published data via the same query functions every public page
// already uses (getPublishedProperties/getPublishedProjects/getPublishedPosts --
// all read from the RLS-safe *_public views, so nothing unpublished or
// admin-only can end up in it). No inventory, URLs, or dates are
// invented -- a property/project/post with no published_at simply omits
// lastModified rather than getting a fabricated one.
//
// /places/[locality]: included for each locality that has at least one
// published individual listing, spelled as the listings spell it (the
// same spelling each place page declares as its canonical URL).

import type { MetadataRoute } from "next";
import { getPublishedProperties } from "@/lib/properties/queries";
import { getPublishedProjects } from "@/lib/projects/queries";
import { getPublishedPosts } from "@/lib/blog/queries";

const SITE_URL = "https://propertyplanet.in";

const STATIC_ROUTES = [
   "",
   "/properties",
   "/projects",
   "/blog",
   "/about",
   "/contact",
   // Phase 4K: /faq removed from the sitemap along with the nav/footer
   // entries -- it currently has no real content (placeholder Lorem
   // Ipsum, see FaqData.ts). Restore once real FAQ copy is authored.
   "/privacy-policy",
   "/terms-of-service",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
   const [properties, projects, posts] = await Promise.all([
      getPublishedProperties().catch(() => []),
      getPublishedProjects().catch(() => []),
      getPublishedPosts().catch(() => []),
   ]);

   const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((path) => ({
      url: `${SITE_URL}${path}`,
   }));

   const propertyEntries: MetadataRoute.Sitemap = properties.map((property) => ({
      url: `${SITE_URL}/properties/${property.slug}`,
      ...(property.publishedAt ? { lastModified: new Date(property.publishedAt) } : {}),
   }));

   const projectEntries: MetadataRoute.Sitemap = projects.map((project) => ({
      url: `${SITE_URL}/projects/${project.slug}`,
      ...(project.publishedAt ? { lastModified: new Date(project.publishedAt) } : {}),
   }));

   // Place pages for every locality that has at least one published
   // individual listing (empty places are noindex, so they stay out).
   // Spelled exactly as the listings spell them, matching the canonical
   // URL each place page declares.
   const localities = new Map<string, string>();
   for (const property of properties) {
      const loc = property.locality?.trim();
      if (loc && !localities.has(loc.toLowerCase())) localities.set(loc.toLowerCase(), loc);
   }
   const placeEntries: MetadataRoute.Sitemap = [...localities.values()].map((loc) => ({
      url: `${SITE_URL}/places/${encodeURIComponent(loc)}`,
   }));

   const postEntries: MetadataRoute.Sitemap = posts.map((post) => ({
      url: `${SITE_URL}/blog/${post.slug}`,
      ...(post.publishedAt ? { lastModified: new Date(post.publishedAt) } : {}),
   }));

   return [...staticEntries, ...propertyEntries, ...projectEntries, ...placeEntries, ...postEntries];
}