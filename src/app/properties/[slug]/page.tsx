import { notFound } from "next/navigation";
import Wrapper from "@/layouts/Wrapper";
import HeaderTwo from "@/layouts/headers/HeaderTwo";
import FooterOne from "@/layouts/footers/FooterOne";
import PropertyDetail from "@/components/properties/PropertyDetail";
import BreadcrumbJsonLd from "@/components/common/seo/BreadcrumbJsonLd";
import BreadcrumbTrail from "@/components/common/breadcrumb/BreadcrumbTrail";
import PropertyJsonLd from "@/components/common/seo/PropertyJsonLd";
import { getPropertyBySlug, getSimilarProperties } from "@/lib/properties/queries";
import { OG_IMAGES, OG_IMAGE_URL } from "@/lib/site/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { slug: string } }) {
   const property = await getPropertyBySlug(params.slug);

   if (!property) {
      return { title: "Property Not Found | Property Planet" };
   }

   const title = `${property.title} | Property Planet`;
   const url = `https://propertyplanet.in/properties/${property.slug}`;

   // Built only from public, published columns. Deliberately never the
   // exact address or any seller contact detail — `property.address` is the
   // locality/city pair that property_public already exposes.
   const description =
      property.overview ??
      `${property.propertyType} for ${property.listingType.toLowerCase()} in ${property.address}${
         property.sqft ? `, ${property.sqft} sqft` : ""
      }.`;

   return {
      title,
      description,
      alternates: { canonical: url },
      openGraph: {
         title,
         description,
         url,
         type: "website",
         siteName: "Property Planet",
         images: property.images[0] ? [{ url: property.images[0] }] : OG_IMAGES,
      },
      // SEO fix (Section 20 — Twitter/X Card): see the identical note in
      // src/app/properties/page.tsx. Mirrors the openGraph block above —
      // same real listing photo, not the generic homepage favicon.
      twitter: {
         card: "summary_large_image",
         title,
         description,
         images: property.images[0] ? [property.images[0]] : [OG_IMAGE_URL],
      },
   };
}

const PropertyDetailPage = async ({ params }: { params: { slug: string } }) => {
   const property = await getPropertyBySlug(params.slug);

   if (!property) {
      notFound();
   }

   const similar = await getSimilarProperties(property);

   return (
      <Wrapper>
         <PropertyJsonLd property={property} />
         {/* Mirrors the real, reachable pages a visitor would actually click
             through (Home -> Properties -> this listing). Kept deliberately
             minimal/accurate rather than inventing a location-page crumb
             that doesn't exist as a real route yet. */}
         <BreadcrumbJsonLd
            items={[
               { name: "Home", path: "/" },
               { name: "Properties", path: "/properties" },
               { name: property.title, path: `/properties/${property.slug}` },
            ]}
         />
         <HeaderTwo style_1={false} style_2={false} staticHeader={true} />
         {/* SEO fix (Stage 2 — Visible Breadcrumbs): same items array as
             BreadcrumbJsonLd above, so the visible trail and the
             structured data can never disagree. */}
         <BreadcrumbTrail
            items={[
               { name: "Home", path: "/" },
               { name: "Properties", path: "/properties" },
               { name: property.title, path: `/properties/${property.slug}` },
            ]}
         />
         <PropertyDetail property={property} similar={similar} />
         <FooterOne style={true} />
      </Wrapper>
   );
};

export default PropertyDetailPage;
