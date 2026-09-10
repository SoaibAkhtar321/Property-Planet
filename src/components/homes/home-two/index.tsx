import FooterOne from "@/layouts/footers/FooterOne"
import HeroBanner from "./HeroBanner"
import FeedbackOne from "./FeedbackOne"
import Property from "./Property"
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
import PropertyPlanetAIAdvisor from "./PropertyPlanetAIAdvisor"

const HomeTwo = () => {
  return (
    <>
      <HeaderTwo style_1={false} style_2={false} />
      <HeroBanner />
      <FeedbackOne />
      <Property />
      <PropertyPlanetHowItWorks />
      <BLockFeatureOne />
      <FancyBannerOne />
      <PropertyPlanetMapIntelligence />
      <PropertyPlanetAIAdvisor />
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
