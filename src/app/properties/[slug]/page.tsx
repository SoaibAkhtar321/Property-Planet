import { notFound } from "next/navigation";
import Wrapper from "@/layouts/Wrapper";
import HeaderTwo from "@/layouts/headers/HeaderTwo";
import FooterOne from "@/layouts/footers/FooterOne";
import PropertyDetail from "@/components/properties/PropertyDetail";
import { getPropertyBySlug, getSimilarProperties } from "@/lib/properties/queries";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { slug: string } }) {
   const property = await getPropertyBySlug(params.slug);
   return {
      title: property ? `${property.title} | Property Planet` : "Property Not Found | Property Planet",
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
