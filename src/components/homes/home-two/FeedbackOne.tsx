import Image from "next/image"

import feedbackShape_1 from "@/assets/images/shape/shape_14.svg";
import feedbackShape_2 from "@/assets/images/shape/shape_15.svg";
import { getPublicSiteReraCertificate } from "@/lib/site/queries";

// Server component (no "use client") so the RERA certificate — admin-
// managed, site-wide, see 0014_site_rera_certificate.sql — can be fetched
// directly here. Renders nothing extra when no certificate has been
// uploaded yet; never fabricates a registration number or legal claim.
const Feedback = async () => {
   const certificate = await getPublicSiteReraCertificate();

   return (
      <div className="feedback-section-two md-pb-40 position-relative z-1">
         <div className="container">
            <div className="row">
               <div className="col-lg-8 order-lg-last">
                  <div className="main-content position-relative z-1">
                     <div className="feedback-block-two">
                       <blockquote className="font-garamond text-white">Serving Hyderabad&apos;s real estate market since 2012 &mdash; every listing <span>legally registered</span> and fully compliant.</blockquote>
                     </div>
                  </div>
               </div>

               <div className="col-lg-4 d-flex order-lg-first">
                  <div className="bg-wrapper h-100 w-100 d-flex flex-column justify-content-center">
                     <div className="row">
                        <div className="col-lg-12 col-md-6">
                           <div className="counter-block-two mb-85 xl-mb-50 md-mb-40">
                              <p className="fs-20 fw-light m0">Verified plot listings across the Hyderabad corridor</p>
                           </div>
                        </div>
                        <div className="col-lg-12 col-md-6">
                           <div className="counter-block-two md-mb-40">
                              <p className="fs-20 fw-light m0">Trusted by buyers and investors alike</p>
                           </div>
                        </div>
                        {certificate && (
                           <div className="col-lg-12">
                              <div className="counter-block-two rera-trust-badge pt-3 border-top border-light border-opacity-25">
                                 <div className="d-flex align-items-start gap-3 mb-10">
                                    <i className="bi bi-patch-check-fill text-white fs-24 mt-1" aria-hidden="true"></i>
                                    <div>
                                       <p className="fs-18 text-white fw-normal m0">{certificate.title || "RERA Registered"}</p>
<p className="fs-14 fw-light text-white opacity-75 mt-5 mb-0">
   {certificate.description ||
      "This project is RERA registered. View the certificate below for verified, transparent registration details."}
</p>
                                    </div>
                                 </div>

                                 {certificate.fileType === "image" ? (
                                    <a href={certificate.url} target="_blank" rel="noopener noreferrer" className="d-block">
                                       <Image
                                          src={certificate.url}
                                          alt={certificate.title || "RERA Certificate"}
                                          width={400}
                                          height={280}
                                          className="lazy-img w-100 rounded"
                                          style={{ height: "auto", border: "1px solid rgba(255,255,255,0.2)" }}
                                          unoptimized
                                       />
                                    </a>
                                 ) : (
                                    <div className="rounded overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.2)" }}>
                                       <iframe
                                          src={`${certificate.url}#toolbar=0`}
                                          title={certificate.title || "RERA Certificate"}
                                          className="w-100"
                                          style={{ height: 260, border: "none" }}
                                       />
                                    </div>
                                 )}

                                 <a
                                    href={certificate.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="fs-14 text-white text-decoration-underline mt-10 d-inline-block"
                                 >
                                    Open full certificate <i className="bi bi-arrow-up-right ms-1"></i>
                                 </a>
                              </div>
                           </div>
                        )}
                     </div>
                  </div>
               </div>
            </div>
         </div>
         <Image src={feedbackShape_1} alt="" className="lazy-img shapes shape_01" />
         <Image src={feedbackShape_2} alt="" className="lazy-img shapes shape_02" />
      </div>
   )
}

export default Feedback
