import Contact from "@/components/inner-pages/contact";
import Wrapper from "@/layouts/Wrapper";

const CANONICAL = "https://propertyplanet.in/contact";
const DESCRIPTION =
   "Get in touch with Property Planet for enquiries about plots, land and property across Hyderabad and the Future City corridor.";

export const metadata = {
   title: "Contact Us | Property Planet",
   description: DESCRIPTION,
   alternates: { canonical: CANONICAL },
   openGraph: {
      title: "Contact Us | Property Planet",
      description: DESCRIPTION,
      url: CANONICAL,
      type: "website",
   },
};
const index = () => {
   return (
      <Wrapper>
         <Contact />
      </Wrapper>
   )
}

export default index