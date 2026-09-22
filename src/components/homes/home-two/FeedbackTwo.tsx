"use client"
import Image from "next/image";
import Slider from "react-slick";
import PropertyPlanetCorridorStats from "./PropertyPlanetCorridorStats";

import feedbackIcon from "@/assets/images/icon/icon_14.svg"
import feedbackShape_2 from "@/assets/images/shape/shape_26.svg"
import feedbackShape_3 from "@/assets/images/shape/shape_27.svg"

// PLACEHOLDER testimonials — same convention as `isDemo` in
// demoProperties.ts. Names/quotes below are illustrative sample content,
// not real client reviews. Swap in genuine client feedback (name, area,
// quote) as it comes in; until then this is clearly local placeholder
// data, not something presented as a bought/verified review.
interface DataType {
   id: number;
   desc: JSX.Element;
   title: string;
   country: string;
   initials: string;
}

const feedback_data: DataType[] = [
   {
      id: 1,
      desc: (<>&quot;Found a well-located plot in Adibatla within my budget. <span>Verification and paperwork were handled properly</span>, no last-minute surprises.&quot;</>),
      title: "Srinivas Reddy",
      country: "Adibatla, Hyderabad",
      initials: "SR",
   },
   {
      id: 2,
      desc: (<>&quot;Site visit was arranged quickly and the team was upfront about title status. <span>Straightforward process</span> from enquiry to registration.&quot;</>),
      title: "Priya Chowdary",
      country: "Kongara Kalan, Hyderabad",
      initials: "PC",
   },
   {
      id: 3,
      desc: (<>&quot;Was comparing a few corridor villages for investment. <span>The team&apos;s local knowledge</span> of Maheshwaram and Mucherla made the decision easier.&quot;</>),
      title: "Anil Kumar",
      country: "Maheshwaram, Hyderabad",
      initials: "AK",
   },
]

const FeedbackTwo = () => {

   const setting = {
      dots: true,
      arrows: false,
      centerPadding: '0px',
      slidesToShow: 1,
      slidesToScroll: 1,
      fade: true,
      autoplay: true,
      autoplaySpeed: 300000
   }

   return (
      <div className="feedback-section-three mt-170 xl-mt-150 lg-mt-100">
         <div className="container">
            {/* Step 3F: pb-180/xl-pb-150 had no lg-/md- reduction, so this
                section kept a 150px bottom pad all the way down through
                tablet and phone widths on top of PropertyPlanetCorridorStats
                immediately below it -- part of the "padded between every
                element" mobile spacing complaint. md-pb-90 (existing
                utility, same convention as the lg-/xl- classes already on
                this element) brings it in line with the already-reduced
                lg-pt-80 top padding at <=991px; untouched above that. */}
            <div className="bg-line position-relative z-1 pt-200 xl-pt-150 lg-pt-80 pb-180 xl-pb-150 md-pb-90">
               <div className="row gx-lg-0">
                  <div className="col-lg-5 col-md-8">
                     <div className="title-one">
                        <div className="upper-title color">CLIENT Feedback</div>
                        <h2 className="font-garamond text-white fs-lg">Don’t Trust us, Trust Our <span className="color">Client.</span></h2>
                     </div>
                  </div>
                  <div className="col-lg-6 ms-auto">
                     <div className="feedback-bg-wrapper md-mt-60 position-relative z-1">
                        <div className="icon d-flex align-items-center justify-content-center rounded-circle">
                           <Image src={feedbackIcon} alt="" className="lazy-img" />
                        </div>
                        <Slider {...setting} className="feedback-slider-one">
                           {feedback_data.map((item) => (
                              <div key={item.id} className="item">
                                 <div className="feedback-block-three">
                                    <blockquote>{item.desc}</blockquote>
                                    <div className="d-flex justify-content-end align-items-center">
                                       <div className="text-end pe-3 pe-lg-5">
                                          <div className="name fs-22 text-white mb-5">{item.title}</div>
                                          <div className="fs-18 text-white opacity-75">{item.country}</div>
                                       </div>
                                       <div className="avatar avatar-initials d-flex align-items-center justify-content-center">{item.initials}</div>
                                    </div>
                                 </div>
                              </div>
                           ))}
                        </Slider>
                     </div>
                  </div>
               </div>
               
               <Image src={feedbackShape_2} alt="" className="lazy-img shapes shape_01" />
               <Image src={feedbackShape_3} alt="" className="lazy-img shapes shape_02" />
            </div>
         </div>
         <PropertyPlanetCorridorStats />

         <style jsx>{`
            .avatar-initials {
               width: 60px;
               height: 60px;
               border-radius: 50%;
               background: #FF6725;
               color: #fff;
               font-size: 18px;
               font-weight: 600;
               letter-spacing: 0.5px;
               flex-shrink: 0;
            }
         `}</style>
      </div>
   )
}

export default FeedbackTwo
