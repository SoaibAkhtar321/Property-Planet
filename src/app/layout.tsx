import "../styles/index.scss";
import type { Metadata, Viewport } from "next";
import ReduxProvider from "@/redux/ReduxProvider";
import GlobalJsonLd from "@/components/common/seo/GlobalJsonLd";

// SEO fix: this used to be a Client Component ('use client') with a
// hand-written <head> full of static meta tags duplicated on every page,
// which meant page-level metadata (title/description/OG from
// properties/[slug], projects/[slug], etc.) could never actually
// override it -- crawlers and social scrapers could see two conflicting
// sets of og:title/og:description on the same page. Moving the Provider
// out to ReduxProvider.tsx lets this go back to a plain Server Component
// so Next's Metadata API is the single source of truth, and per-page
// `metadata`/`generateMetadata` exports now correctly merge into (and
// override) these defaults instead of duplicating them.
//
// `metadataBase` is what makes relative openGraph.images (e.g. a
// property's own gallery image) resolve to a correct absolute URL --
// there was no metadataBase before, so OG image tags across the site
// were only ever reliable when a page passed a fully-qualified URL.

const SITE_URL = "https://propertyplanet.in";
const SITE_DESCRIPTION =
   "Property Planet is Hyderabad's AI-powered land and property advisory platform, connecting landowners, developers and buyers across Future City and the southern growth corridors.";

export const metadata: Metadata = {
   metadataBase: new URL(SITE_URL),
   // No `template` here deliberately: every existing page-level title
   // (properties/[slug], projects/[slug], /properties, /projects, blog,
   // etc.) already appends "| Property Planet" itself. A title template
   // would double up the brand suffix on every one of those ("X |
   // Property Planet | Property Planet") instead of just filling in the
   // handful of pages that don't set a title at all. `default` only
   // covers those.
   title: "Property Planet — Hyderabad's AI-Powered Land & Property Advisory Platform",
   description: SITE_DESCRIPTION,
   openGraph: {
      siteName: "Property Planet",
      url: SITE_URL,
      type: "website",
      title: "Property Planet — Hyderabad's AI-Powered Land & Property Advisory Platform",
      description: SITE_DESCRIPTION,
      // The old value ("images/assets/ogg.png") was both a relative path
      // AND pointed at a file that does not exist anywhere in public/ --
      // confirmed by searching the repo. Falling back to the real
      // favicon.png so og:image at least resolves to something valid
      // rather than a broken/blank social preview, but this is a stopgap:
      // favicon.png is a small square icon, not a proper 1200x630 social
      // share image. Flagged in the final report -- replace with a real
      // OG image asset.
      images: ["/favicon.png"],
   },
   icons: {
      icon: "/favicon.png",
   },
   twitter: {
      card: "summary_large_image",
      title: "Property Planet — Hyderabad's AI-Powered Land & Property Advisory Platform",
      description: SITE_DESCRIPTION,
      images: ["/favicon.png"],
   },
   other: {
      "msapplication-navbutton-color": "#0D1A1C",
      "apple-mobile-web-app-status-bar-style": "#0D1A1C",
   },
};

// themeColor moved out of `metadata` into its own `viewport` export --
// Next 14 deprecated it on Metadata in favor of this (same value,
// no behavior change, just avoids a build-time warning).
export const viewport: Viewport = {
   themeColor: "#0D1A1C",
};

export default function RootLayout({
   children,
}: {
   children: React.ReactNode;
}) {
   const isDev = process.env.NODE_ENV === "development";

   return (
      <html lang="en" suppressHydrationWarning={isDev}>
         <head>
            {/* For IE */}
            <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
            <link
               rel="stylesheet"
               href="https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,500&display=swap"
            />
            <GlobalJsonLd />
         </head>
         <body suppressHydrationWarning={true}>
            <div className="main-page-wrapper">
               <ReduxProvider>{children}</ReduxProvider>
            </div>
         </body>
      </html>
   );
}
