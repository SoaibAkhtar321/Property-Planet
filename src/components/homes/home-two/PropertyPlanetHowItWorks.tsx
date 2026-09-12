"use client"

const steps = [
   {
      icon: "fa-regular fa-house-flag",
      label: "Landowner / Developer / Seller",
      desc: "Submits land, a plot, a villa or a commercial opportunity for review.",
   },
   {
      icon: "fa-regular fa-shield-check",
      label: "Property Planet",
      desc: "Verifies details, scores trust, and uses AI to match demand — backed by our advisory team.",
   },
   {
      icon: "fa-regular fa-users",
      label: "Qualified Buyer",
      desc: "Developer, company or individual buyer discovers a suitable, verified opportunity.",
   },
   {
      icon: "fa-regular fa-handshake",
      label: "Site Visit / Enquiry / Transaction",
      desc: "Property Planet manages the advisory process through to closure.",
   },
]

const PropertyPlanetHowItWorks = () => {
   return (
      <div className="property-planet-how-it-works position-relative z-1 mt-150 xl-mt-120 md-mt-80">
         <div className="container">
            <div className="title-one text-center mb-60 lg-mb-40 wow fadeInUp">
               <h2 className="font-garamond">How Property Planet Works</h2>
               <p className="fs-22 mt-xs">Not just a listing site — a verified, AI-assisted advisory layer between landowners and buyers.</p>
            </div>

            <div className="how-it-works-row d-flex flex-wrap justify-content-between align-items-stretch">
               {steps.map((step, i) => (
                  <div key={i} className="how-it-works-step wow fadeInUp" data-wow-delay={`0.${i}s`}>
                     <div className="step-number">{`0${i + 1}`}</div>
                     <div className="step-icon rounded-circle d-flex align-items-center justify-content-center">
                        <i className={step.icon}></i>
                     </div>
                     <h5 className="mt-20 mb-10">{step.label}</h5>
                     <p className="fs-16 opacity-75 mb-0">{step.desc}</p>
                     {i < steps.length - 1 && <i className="fa-solid fa-arrow-right-long step-arrow d-none d-lg-block"></i>}
                  </div>
               ))}
            </div>
         </div>

         <style jsx>{`
            .how-it-works-row {
               gap: 24px;
            }
            .how-it-works-step {
               position: relative;
               flex: 1 1 220px;
               background: #fff;
               border: 1px solid #F5EDE8;
               border-radius: 12px;
               padding: 30px 24px;
               box-shadow: 0 10px 30px rgba(20, 20, 10, 0.04);
            }
            .step-number {
               font-family: var(--font-garamond, serif);
               font-size: 15px;
               font-weight: 600;
               opacity: 0.45;
               margin-bottom: 14px;
            }
            .step-icon {
               width: 54px;
               height: 54px;
               background: #FFF8F4;
               font-size: 20px;
               color: #FF6725;
            }
            .step-arrow {
               position: absolute;
               top: 50%;
               right: -32px;
               transform: translateY(-50%);
               font-size: 18px;
               opacity: 0.35;
            }
            @media (max-width: 991px) {
               .how-it-works-row {
                  flex-direction: column;
               }
            }
         `}</style>
      </div>
   )
}

export default PropertyPlanetHowItWorks
