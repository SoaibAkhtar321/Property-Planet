import SellProperty from "@/components/inner-pages/sell-property";
import Wrapper from "@/layouts/Wrapper";

export const metadata = {
   title: "Property Planet — Sell / List Your Property",
};

const index = () => {
   return (
      <Wrapper>
         <SellProperty />
      </Wrapper>
   )
}

export default index
