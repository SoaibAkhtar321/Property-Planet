// RealEstateListing structured data for a single published property.
// Built only from fields the property record actually has -- price is
// included only because it's a real, publicly displayed figure (never
// invented), and no rating/review/verification fields are added since
// none of that exists in the data model. Seller contact info is
// deliberately never included here, matching property.overview's own
// address-only (no exact address / no contact) rule in
// properties/[slug]/page.tsx.

const SITE_URL = "https://propertyplanet.in";

export type PropertyJsonLdInput = {
   title: string;
   slug: string;
   address: string;
   propertyType: string;
   price: number;
   sqft?: number;
   images: string[];
};

export default function PropertyJsonLd({ property }: { property: PropertyJsonLdInput }) {
   const url = `${SITE_URL}/properties/${property.slug}`;

   const data: Record<string, unknown> = {
      "@context": "https://schema.org",
      "@type": "RealEstateListing",
      name: property.title,
      url,
      about: {
         "@type": "Place",
         name: property.title,
         address: property.address,
      },
      offers: {
         "@type": "Offer",
         price: property.price,
         priceCurrency: "INR",
         availability: "https://schema.org/InStock",
         url,
      },
   };

   if (property.images[0]) data.image = property.images;
   if (property.sqft) data.floorSize = { "@type": "QuantitativeValue", value: property.sqft, unitCode: "FTK" };

   return (
      <script
         type="application/ld+json"
         // eslint-disable-next-line react/no-danger
         dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
      />
   );
}
