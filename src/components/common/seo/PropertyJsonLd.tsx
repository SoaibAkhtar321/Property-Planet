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
   /**
    * Already-formatted suffix from the shared priceUnit vocabulary/formatter
    * (priceUnitSuffix() in @/lib/properties/priceUnit), e.g. "/ sq. ft." or
    * "/ CustomLabel". Undefined/empty for a listing with no price_unit —
    * same "unlabeled total price" state every pre-Phase-A listing is in.
    */
   priceUnit?: string;
   sqft?: number;
   images: string[];
};

// Turns the display suffix ("/ sq. ft.", "/ CustomLabel") into a bare unit
// label ("sq. ft.", "CustomLabel") for schema.org's unitText, which doesn't
// use a leading slash. Strips only the leading "/ " this component itself
// adds — not a general parser, since the suffix always comes from the one
// shared formatter above.
function toUnitText(suffix: string): string {
   return suffix.replace(/^\/\s*/, "").trim();
}

export default function PropertyJsonLd({ property }: { property: PropertyJsonLdInput }) {
   const url = `${SITE_URL}/properties/${property.slug}`;
   const unitText = property.priceUnit ? toUnitText(property.priceUnit) : "";

   const offer: Record<string, unknown> = {
      "@type": "Offer",
      priceCurrency: "INR",
      availability: "https://schema.org/InStock",
      url,
   };

   // A per-unit price (sqft/sqyd/sqm/acre/custom) is not the total offer
   // price, so stating it as a flat `price` would misrepresent the listing.
   // priceSpecification says exactly what the number means instead. No
   // conversion/recalculation happens here -- the stored number is used
   // as-is, same rule as every other display surface.
   if (unitText) {
      offer.priceSpecification = {
         "@type": "UnitPriceSpecification",
         price: property.price,
         priceCurrency: "INR",
         unitText,
      };
   } else {
      // Unlabeled/total -- unchanged from today's behavior.
      offer.price = property.price;
   }

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
      offers: offer,
   };

   if (property.images[0]) data.image = property.images;
   if (property.sqft) data.floorSize = { "@type": "QuantitativeValue", value: property.sqft, unitCode: "FTK" };

   // JSON.stringify does not escape "</", so a custom price-unit label (or
   // any other free-text field) containing "</script>" could break out of
   // this script tag. Escaping "<" as the unicode-escaped form is the
   // standard safe way to embed arbitrary JSON inside a <script> tag --
   // valid JSON, and \u003c is never a literal "<" for the HTML parser to
   // act on.
   const json = JSON.stringify(data).replace(/</g, "\\u003c");

   return (
      <script
         type="application/ld+json"
         // eslint-disable-next-line react/no-danger
         dangerouslySetInnerHTML={{ __html: json }}
      />
   );
}
