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
// TODO(ai-widget): PropertyPlanetAIAdvisor is disabled — its current dataset
// (src/data/home-data/PropertyData.ts via src/utils/propertyPlanetAIEngine.ts)
// is static template/demo data with fabricated verification status, trust
// scores, and prices. Do not re-enable until it is wired to real Supabase
// property/project data. Component and data files are intentionally left
// in place for that future work.
// import PropertyPlanetAIAdvisor from "./PropertyPlanetAIAdvisor"

const HomeTwo = () => {
  return (
    <>
      <HeaderTwo style_1={false} style_2={false} />
      <HeroBanner />
      <FeedbackOne />
      <Property />
      <ExploreProperties />
      <PropertyPlanetHowItWorks />
      <BLockFeatureOne />
      <FancyBannerOne />
      <PropertyPlanetMapIntelligence />
      {/* PropertyPlanetAIAdvisor disabled — see TODO(ai-widget) above */}
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
