import FooterOne from "@/layouts/footers/FooterOne"
import HeroBanner from "./HeroBanner"
import FeedbackOne from "./FeedbackOne"
import Property from "./Property"
import ExploreProperties from "./ExploreProperties"
import BLockFeatureOne from "./BLockFeatureOne"
import FancyBannerOne from "./FancyBannerOne"
import BLockFeatureTwo from "./BLockFeatureTwo"
import FeedbackTwo from "./FeedbackTwo"
import Blog from "./Blog"
import FAQ from "./FAQ"
import FancyBannerTwo from "./FancyBannerTwo"
import HeaderTwo from "@/layouts/headers/HeaderTwo"
import PropertyPlanetHowItWorks from "./PropertyPlanetHowItWorks"
import PropertyPlanetMapIntelligence from "./PropertyPlanetMapIntelligence"
import SellerFancyBanner from "@/components/inner-pages/about-us/about-us-two/FancyBanner"

const HomeTwo = () => {
  return (
    <>
      <HeaderTwo style_1={false} style_2={false} />
      <HeroBanner />
      <SellerFancyBanner />
      <FeedbackOne />
      <Property />
      <ExploreProperties />
      <PropertyPlanetHowItWorks />
      <BLockFeatureOne />
      <FancyBannerOne />
      <PropertyPlanetMapIntelligence />
      <BLockFeatureTwo />
      <FeedbackTwo />
      <Blog style={false} />
      <FAQ />
      <FancyBannerTwo/>
      <FooterOne style={true} />
    </>
  )
}

export default HomeTwo
