import "../styles/index.scss";
import type { Metadata, Viewport } from "next";
import { EB_Garamond } from "next/font/google";
import ReduxProvider from "@/redux/ReduxProvider";
import GlobalJsonLd from "@/components/common/seo/GlobalJsonLd";
import { OG_IMAGES, OG_IMAGE_URL } from "@/lib/site/seo";

// SEO/perf fix: EB Garamond (the site's `.font-garamond` heading font —
// see public/assets/scss/_variables.scss's $sub-font) was previously
// loaded via a render-blocking <link rel="stylesheet"> to
// fonts.googleapis.com with no preconnect: every page paid for an extra
// DNS lookup + connection + CSS fetch + font fetch, all blocking render,
// before any heading could paint. next/font/google self-hosts the same
// font at build time (same family, same weights/styles, same
// display: "swap"), serving it from this domain with no external
// request and no render-blocking stylesheet at all.
const ebGaramond = EB_Garamond({
   subsets: ["latin"],
   weight: ["400", "500", "600", "700"],
   style: ["normal", "italic"],
   display: "swap",
   variable: "--font-eb-garamond",
});

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
// Permanent Property Planet symbol (icon only, no wordmark) -- also the
// favicon PNG and the header icon on small screens.
const ICON_URL = "/assets/images/logo/property-planet-icon.png";
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
      // 1200x630 brand card (existing logo + tagline). Pages that define their
      // own `openGraph` replace this object entirely, so each passes OG_IMAGES
      // itself — see src/lib/site/seo.ts.
      images: OG_IMAGES,
   },
   icons: {
      icon: [
         { url: "/favicon.ico", sizes: "any" },
         { url: ICON_URL, type: "image/png", sizes: "512x512" },
      ],
      apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
   },
   twitter: {
      card: "summary_large_image",
      title: "Property Planet — Hyderabad's AI-Powered Land & Property Advisory Platform",
      description: SITE_DESCRIPTION,
      images: [OG_IMAGE_URL],
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
   return (
      <html lang="en" className={ebGaramond.variable} suppressHydrationWarning>
         <head>
            <script
               dangerouslySetInnerHTML={{
                  __html: `(function(){try{var k='pp-theme';var t=localStorage.getItem(k)||'system';var d=t==='dark'||(t!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);var r=d?'dark':'light';document.documentElement.setAttribute('data-theme',r);document.documentElement.style.colorScheme=r;}catch(e){}})();`,
               }}
            />
            {/* For IE */}
            <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
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
