import { notFound } from "next/navigation";
import Wrapper from "@/layouts/Wrapper";
import HeaderTwo from "@/layouts/headers/HeaderTwo";
import FooterOne from "@/layouts/footers/FooterOne";
import PropertyDetail from "@/components/properties/PropertyDetail";
import { getPropertyBySlug, getSimilarProperties } from "@/lib/properties/queries";

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
         images: property.images[0] ? [{ url: property.images[0] }] : undefined,
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
         <HeaderTwo style_1={false} style_2={false} />
         <PropertyDetail property={property} similar={similar} />
         <FooterOne style={true} />
      </Wrapper>
   );
};

export default PropertyDetailPage;
