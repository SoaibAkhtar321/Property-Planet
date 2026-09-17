// Global structured data: Organization + WebSite.
//
// Only real, already-public information goes here — the same name/URL/
// description used elsewhere in the app's own metadata. No ratings,
// reviews, addresses, or social profiles are invented; social profile
// links can be added here later only once/if Property Planet actually
// owns and publishes them somewhere on the site.

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
