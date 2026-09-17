import TermsOfService from "@/components/inner-pages/terms-of-service";
import Wrapper from "@/layouts/Wrapper";

const CANONICAL = "https://propertyplanet.in/terms-of-service";

export const metadata = {
   title: "Terms of Service | Property Planet",
   description: "The terms governing use of the Property Planet platform.",
   alternates: { canonical: CANONICAL },
   robots: { index: true, follow: true },
};
const index = () => {
   return (
      <Wrapper>
         <TermsOfService />
      </Wrapper>
   )
}

export default index
