// src/lib/site/seo.ts
//
// Shared social-sharing image for Property Planet.
//
// Why this exists: Next replaces a parent's `openGraph` / `twitter` object
// wholesale when a page defines its own, so every page that sets
// `openGraph` (title/description/url) without `images` was dropping the
// root layout's og:image and sharing with no preview at all. Pages now
// pass OG_IMAGES / OG_IMAGE_URL explicitly.
//
// The image is a static 1200x630 brand card (existing logo + tagline). It
// contains no listing, seller, buyer or location data, so it is safe as the
// default for every page. Property/project/blog detail pages still prefer
// their own PUBLIC cover image and only fall back to this one.

export const OG_IMAGE_URL = "/assets/images/og/property-planet-og.png";

export const OG_IMAGE_ALT = "Property Planet — land, plots, villas and apartments in Hyderabad";

export const OG_IMAGES = [{ url: OG_IMAGE_URL, width: 1200, height: 630, alt: OG_IMAGE_ALT }];
