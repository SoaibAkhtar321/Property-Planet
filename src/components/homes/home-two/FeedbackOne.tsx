import Image from "next/image"

import feedbackShape_2 from "@/assets/images/shape/shape_15.svg";
import ReraCertificateViewer from "@/components/common/ReraCertificateViewer";
import { getPublicSiteReraCertificate } from "@/lib/site/queries";

// Homepage trust strip: one statement plus the RERA certificate (admin-
// managed, 0014_site_rera_certificate.sql) as a small thumbnail that opens
// full size. The old vague filler lines ("Plot listings across the
// corridor", "Trusted by buyers…") are gone. Without an uploaded
// certificate only the statement renders — no invented registration claim.
const Feedback = async () => {
   const certificate = await getPublicSiteReraCertificate();
   const title = certificate?.title || "RERA Registered";

   return (
      <section className="pp-trust-strip position-relative z-1">
         <div className="container">
            <div className={`pp-trust-strip__grid ${certificate ? "" : "pp-trust-strip__grid--solo"}`}>
               <blockquote className="font-garamond text-white m0">
                  Serving Hyderabad&apos;s real estate market since 2012 &mdash; every listing <span>reviewed by our team</span> before it goes live.
               </blockquote>

               {certificate && (
                  <div className="pp-rera-card">
                     <ReraCertificateViewer url={certificate.url} title={title} fileType={certificate.fileType} />
                     <div className="pp-rera-card__text">
                        <p className="pp-rera-card__title"><i className="bi bi-patch-check-fill" aria-hidden="true"></i> {title}</p>
                        <p className="pp-rera-card__desc">
                           {certificate.description || "Property Planet is RERA registered to operate as a real estate business."}
                        </p>
                        <span className="pp-rera-card__hint">Tap the certificate to view it full size</span>
                     </div>
                  </div>
               )}
            </div>
         </div>
         <Image src={feedbackShape_2} alt="" className="lazy-img shapes pp-trust-strip__shape" />
      </section>
   )
}

export default Feedback
