import SellProperty from "@/components/inner-pages/sell-property";
import Wrapper from "@/layouts/Wrapper";

// SEO fix: this page had only a bare `title` — no description, canonical,
// or Open Graph, unlike every other static page (about, contact,
// faq). The page itself is a lead-capture form for owners/agents wanting
// to list a property, which is what the description below actually says.
const CANONICAL = "https://propertyplanet.in/sell-property";
const DESCRIPTION =
   "List your plot, land or property with Property Planet. Submit your details and our team will help you reach verified buyers across Hyderabad.";

export const metadata = {
   title: "Sell / List Your Property | Property Planet",
   description: DESCRIPTION,
   alternates: { canonical: CANONICAL },
   openGraph: {
      title: "Sell / List Your Property | Property Planet",
      description: DESCRIPTION,
      url: CANONICAL,
      type: "website",
   },
};

const index = () => {
   return (
      <Wrapper>
         <SellProperty />
      </Wrapper>
   )
}

export default index
