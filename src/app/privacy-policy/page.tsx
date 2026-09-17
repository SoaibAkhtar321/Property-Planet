import PrivacyPolicy from "@/components/inner-pages/privacy-policy";
import Wrapper from "@/layouts/Wrapper";

const CANONICAL = "https://propertyplanet.in/privacy-policy";

export const metadata = {
   title: "Privacy Policy | Property Planet",
   description: "How Property Planet collects, uses and protects your information.",
   alternates: { canonical: CANONICAL },
   robots: { index: true, follow: true },
};
const index = () => {
   return (
      <Wrapper>
         <PrivacyPolicy />
      </Wrapper>
   )
}

export default index
