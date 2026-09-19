import AboutUsTwo from "@/components/inner-pages/about-us/about-us-two";
import Wrapper from "@/layouts/Wrapper";
import { OG_IMAGES, OG_IMAGE_URL } from "@/lib/site/seo";

const CANONICAL = "https://propertyplanet.in/about";
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
      images: OG_IMAGES,
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