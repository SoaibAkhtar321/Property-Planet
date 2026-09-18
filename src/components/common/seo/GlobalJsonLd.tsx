// Global structured data: Organization + WebSite.
//
// Only real, already-public information goes here — the same name/URL/
// description used elsewhere in the app's own metadata. No ratings,
// reviews, or invented social profiles: `telephone`, `email` and `sameAs`
// below are read from src/lib/site/contact.ts, the single verified source
// of truth already live in the footer/header, so this can never drift
// out of sync with what a visitor actually sees on the page, and never
// lists an account Property Planet doesn't actually hold.

import { CONTACT_EMAIL, CONTACT_PHONE, SOCIAL_LINKS } from "@/lib/site/contact";

const SITE_URL = "https://propertyplanet.in";

export default function GlobalJsonLd() {
   const organization = {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "Property Planet",
      url: SITE_URL,
      logo: `${SITE_URL}/favicon.png`,
      description:
         "Property Planet is Hyderabad's AI-powered land and property advisory platform, connecting landowners, developers and buyers across Future City and the southern growth corridors.",
      telephone: `+91${CONTACT_PHONE}`,
      email: CONTACT_EMAIL,
      // Local SEO / Google Business Profile matching: Google ties an
      // Organization's Knowledge Panel / Business Profile to it partly via
      // `sameAs`-linked social profiles. Maps 1:1 to SOCIAL_LINKS -- empty
      // array (omitted) until a verified account exists, same rule the
      // footer already follows.
      ...(SOCIAL_LINKS.length > 0 ? { sameAs: SOCIAL_LINKS.map((s) => s.href) } : {}),
   };

   const website = {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "Property Planet",
      url: SITE_URL,
   };

   return (
      <>
         <script
            type="application/ld+json"
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{ __html: JSON.stringify(organization) }}
         />
         <script
            type="application/ld+json"
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{ __html: JSON.stringify(website) }}
         />
      </>
   );
}
