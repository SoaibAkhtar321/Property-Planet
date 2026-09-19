// src/app/manifest.ts
//
// Web app manifest (served at /manifest.webmanifest, linked automatically by
// Next). Reuses the existing Property Planet symbol — same brand icon the
// favicon and apple-touch-icon already use — so "Add to Home Screen" on
// Android/Chrome gets a proper name and icon instead of a page screenshot.
// Colours match the existing theme colour in src/app/layout.tsx.

import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
   return {
      name: "Property Planet",
      short_name: "Property Planet",
      description: "Discover plots, land, villas and apartments across Hyderabad's growth corridors.",
      start_url: "/",
      display: "standalone",
      background_color: "#FFFFFF",
      theme_color: "#0D1A1C",
      icons: [
         { src: "/assets/images/logo/property-planet-icon-192.png", sizes: "192x192", type: "image/png" },
         { src: "/assets/images/logo/property-planet-icon.png", sizes: "512x512", type: "image/png" },
      ],
   };
}
