import SellerLogin from "@/components/inner-pages/seller-login";
import Wrapper from "@/layouts/Wrapper";

export const metadata = {
   title: "Property Planet — Seller/Agent Login",
};

const index = () => {
   return (
      <Wrapper>
         <SellerLogin />
      </Wrapper>
   )
}

export default index
