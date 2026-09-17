import ForgotPassword from "@/components/inner-pages/forgot-password";
import Wrapper from "@/layouts/Wrapper";

export const metadata = {
   title: "Property Planet — Reset Password",
   // SEO fix: private/authenticated route -- never meant to appear in
   // search results. robots.txt already disallows crawling this path,
   // but a noindex meta tag is the mechanism Google actually recommends
   // for keeping a specific URL out of the index (a robots.txt disallow
   // alone can still let an externally-linked URL appear indexed with no
   // snippet). Defense-in-depth alongside the existing robots.txt rule.
   robots: { index: false, follow: false },
};

const index = () => {
   return (
      <Wrapper>
         <ForgotPassword />
      </Wrapper>
   )
}

export default index
