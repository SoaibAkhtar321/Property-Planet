import ServiceOne from "@/components/inner-pages/services/service-one";
import Wrapper from "@/layouts/Wrapper";

export const metadata = {
   title: "Property Planet — Service One",
};
const index = () => {
   return (
      <Wrapper>
         <ServiceOne />
      </Wrapper>
   )
}

export default index