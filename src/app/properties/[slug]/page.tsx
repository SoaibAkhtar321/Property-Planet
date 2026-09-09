import { notFound } from "next/navigation";
import Wrapper from "@/layouts/Wrapper";
import HeaderTwo from "@/layouts/headers/HeaderTwo";
import FooterOne from "@/layouts/footers/FooterOne";
import PropertyDetail from "@/components/properties/PropertyDetail";
import demoProperties from "@/components/properties/data/demoProperties";

export function generateMetadata({ params }: { params: { slug: string } }) {
   const property = demoProperties.find((item) => item.slug === params.slug);
   return {
      title: property ? `${property.title} | Property Planet` : "Property Not Found | Property Planet",
   };
}

const PropertyDetailPage = ({ params }: { params: { slug: string } }) => {
   const property = demoProperties.find((item) => item.slug === params.slug);

   if (!property) {
      notFound();
   }

   return (
      <Wrapper>
         <HeaderTwo style_1={false} style_2={false} />
         <PropertyDetail property={property} />
         <FooterOne style={true} />
      </Wrapper>
   );
};

export default PropertyDetailPage;
