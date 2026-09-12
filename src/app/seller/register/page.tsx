import SellerRegister from "@/components/inner-pages/seller-register";
import Wrapper from "@/layouts/Wrapper";

export const metadata = {
   title: "Property Planet — Register as Seller/Agent",
};

const index = () => {
   return (
      <Wrapper>
         <SellerRegister />
      </Wrapper>
   )
}

export default index
