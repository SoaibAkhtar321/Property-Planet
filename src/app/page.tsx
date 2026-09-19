
import Wrapper from "@/layouts/Wrapper";
import HomeTwo from "@/components/homes/home-two";
import { OG_IMAGES, OG_IMAGE_URL } from "@/lib/site/seo";
const CANONICAL = "https://propertyplanet.in";
const DESCRIPTION =
  "Property Planet is Hyderabad's AI-powered land and property advisory platform, connecting landowners, developers and buyers across Future City and the southern growth corridors.";

export const metadata = {
  title: "Property Planet — Hyderabad's AI-Powered Land & Property Advisory Platform",
  description: DESCRIPTION,
  alternates: { canonical: CANONICAL },
  openGraph: {
    title: "Property Planet — Hyderabad's AI-Powered Land & Property Advisory Platform",
    description: DESCRIPTION,
    url: CANONICAL,
    type: "website",
      images: OG_IMAGES,
  },
};
const index = () => {
  return (
    <Wrapper>
      <HomeTwo />
    </Wrapper>
  )
}

export default index
