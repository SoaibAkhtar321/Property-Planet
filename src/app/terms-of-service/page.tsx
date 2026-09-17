import TermsOfService from "@/components/inner-pages/terms-of-service";
import Wrapper from "@/layouts/Wrapper";

export const metadata = {
   title: "Property Planet — Terms of Service",
};
const index = () => {
   return (
      <Wrapper>
         <TermsOfService />
      </Wrapper>
   )
}

export default index
