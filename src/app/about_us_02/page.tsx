import AboutUsTwo from "@/components/inner-pages/about-us/about-us-two";
import Wrapper from "@/layouts/Wrapper";

const CANONICAL = "https://propertyplanet.in/about_us_02";
const DESCRIPTION =
   "Learn about Property Planet, Hyderabad's AI-powered land and property advisory platform connecting landowners, developers and buyers across Future City and the southern growth corridors.";

export const metadata = {
   title: "About Us | Property Planet",
   description: DESCRIPTION,
   alternates: { canonical: CANONICAL },
   openGraph: {
      title: "About Us | Property Planet",
      description: DESCRIPTION,
      url: CANONICAL,
      type: "website",
   },
};
const index = () => {
   return (
      <Wrapper>
         <AboutUsTwo />
      </Wrapper>
   )
}

export default index