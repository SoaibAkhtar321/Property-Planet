import Faq from "@/components/inner-pages/faq";
import Wrapper from "@/layouts/Wrapper";
import { OG_IMAGES, OG_IMAGE_URL } from "@/lib/site/seo";

const CANONICAL = "https://propertyplanet.in/faq";
const DESCRIPTION =
   "Answers to common questions about buying, selling and listing plots, land and property with Property Planet in Hyderabad.";

export const metadata = {
   title: "Frequently Asked Questions | Property Planet",
   description: DESCRIPTION,
   alternates: { canonical: CANONICAL },
   // Phase 4K: not linked from nav/footer/sitemap right now -- the page's
   // content is still placeholder Lorem Ipsum (see FaqData.ts). noindex
   // keeps it out of search results if reached directly, same pattern as
   // /auth/forgot-password. Remove once real FAQ copy is authored.
   robots: { index: false, follow: false },
   openGraph: {
      title: "Frequently Asked Questions | Property Planet",
      description: DESCRIPTION,
      url: CANONICAL,
      type: "website",
      images: OG_IMAGES,
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