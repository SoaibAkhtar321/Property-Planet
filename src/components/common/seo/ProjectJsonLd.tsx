// RealEstateListing structured data for a project (a multi-unit
// development, e.g. Urban Crest) -- mirrors PropertyJsonLd's pattern for
// a single property, but for the project as a whole.
//
// Only fields the project record actually has are included. `offers` is
// built only from real project_pricing rows with a genuine numeric price
// (the same data ProjectDetail.tsx renders to visitors) -- never a
// derived/estimated figure, and omitted entirely when no project_pricing
// data exists. No rating, review, RERA/legal-verification, or address
// beyond the project's own public `location` string is added, matching
// this project's own no-exact-address rule in ProjectDetail.tsx.

const SITE_URL = "https://propertyplanet.in";

export type ProjectJsonLdPricingInput = {
   label: string;
   price?: number;
   currency?: string;
};

export type ProjectJsonLdInput = {
   title: string;
   slug: string;
   location?: string;
   overview?: string;
   images: string[];
   totalArea?: number;
   totalAreaUnit?: string;
   pricing?: ProjectJsonLdPricingInput[];
};

export default function ProjectJsonLd({ project }: { project: ProjectJsonLdInput }) {
   const url = `${SITE_URL}/projects/${project.slug}`;

   const data: Record<string, unknown> = {
      "@context": "https://schema.org",
      "@type": "RealEstateListing",
      name: project.title,
      url,
      about: {
         "@type": "Place",
         name: project.title,
         ...(project.location ? { address: project.location } : {}),
      },
   };

   if (project.overview) data.description = project.overview;
   if (project.images[0]) data.image = project.images;
   if (project.totalArea) {
      data.floorSize = {
         "@type": "QuantitativeValue",
         value: project.totalArea,
         unitText: project.totalAreaUnit ?? undefined,
      };
   }

   // Real, visitor-facing pricing rows only -- never a fabricated or
   // estimated "starting from" figure.
   const pricedOffers = (project.pricing ?? []).filter(
      (row): row is ProjectJsonLdPricingInput & { price: number } => typeof row.price === "number"
   );
   if (pricedOffers.length > 0) {
      data.offers = pricedOffers.map((row) => ({
         "@type": "Offer",
         name: row.label,
         price: row.price,
         priceCurrency: row.currency ?? "INR",
         availability: "https://schema.org/InStock",
         url,
      }));
   }

   return (
      <script
         type="application/ld+json"
         // eslint-disable-next-line react/no-danger
         dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
      />
   );
}
