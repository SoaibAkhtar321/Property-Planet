import Wrapper from "@/layouts/Wrapper";
import HeaderTwo from "@/layouts/headers/HeaderTwo";
import FooterOne from "@/layouts/footers/FooterOne";
import PropertiesListing from "@/components/properties/PropertiesListing";

export const metadata = {
   title: "Properties | Property Planet",
};

const PropertiesPage = () => {
   return (
      <Wrapper>
         <HeaderTwo style_1={false} style_2={false} />
         <PropertiesListing />
         <FooterOne style={true} />
      </Wrapper>
   );
};

export default PropertiesPage;
