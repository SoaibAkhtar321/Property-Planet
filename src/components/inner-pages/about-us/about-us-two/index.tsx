import BreadcrumbTwo from "@/components/common/breadcrumb/BreadcrumbTwo";
import HeaderTwo from "@/layouts/headers/HeaderTwo";
import BLockFeatureOne from "./BLockFeatureOne";
import BLockFeatureTwo from "./BLockFeatureTwo";
import Brand from "./Brand";
import FancyBanner from "./FancyBanner";
import FooterTwo from "@/layouts/footers/FooterTwo";

// Phase 4K: the client-testimonial section (Feedback, from
// @/components/homes/home-six/Feedback -- used exclusively here, confirmed
// before removal) was removed. It showed fabricated names, fabricated
// locations ("Miami, USA"), stock photos, and a fabricated "9.3 Rating"
// under "Rely on Clients, Not Just Our Claims." -- none of it real
// Property Planet client feedback. Not replaced with invented
// testimonials; add back with real reviews if/when available.
const AboutUsTwo = () => {
   return (
      <>
         <HeaderTwo style_1={true} style_2={false} />
         <BreadcrumbTwo title="About Agency" sub_title="About us" />
         <BLockFeatureOne />
         <BLockFeatureTwo />
         <Brand />
         <FancyBanner />
         <FooterTwo />
      </>
   )
}

export default AboutUsTwo;
