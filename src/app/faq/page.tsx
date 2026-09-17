import Faq from "@/components/inner-pages/faq";
import Wrapper from "@/layouts/Wrapper";

const CANONICAL = "https://propertyplanet.in/faq";
const DESCRIPTION =
   "Answers to common questions about buying, selling and listing plots, land and property with Property Planet in Hyderabad.";

export const metadata = {
   title: "Frequently Asked Questions | Property Planet",
   description: DESCRIPTION,
   alternates: { canonical: CANONICAL },
   openGraph: {
      title: "Frequently Asked Questions | Property Planet",
      description: DESCRIPTION,
      url: CANONICAL,
      type: "website",
   },
};
const index = () => {
   return (
      <Wrapper>
         <Faq />
      </Wrapper>
   )
}

export default index