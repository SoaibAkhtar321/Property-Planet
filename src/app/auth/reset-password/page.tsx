import ResetPassword from "@/components/inner-pages/reset-password";
import Wrapper from "@/layouts/Wrapper";

export const metadata = {
   title: "Property Planet — Choose New Password",
};

const index = () => {
   return (
      <Wrapper>
         <ResetPassword />
      </Wrapper>
   )
}

export default index
