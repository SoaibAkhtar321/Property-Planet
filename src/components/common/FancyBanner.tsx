"use client"
import Image from "next/image"
import Link from "next/link"
import titleShape from "@/assets/images/shape/title_shape_06.svg"

const FancyBanner = ({ style }: any) => {
   return (
      <div className="fancy-banner-two position-relative z-1 pt-90 lg-pt-50 pb-90 lg-pb-50">
         <div className="container">
            <div className="row align-items-center">
               <div className="col-lg-6">
                  <div className="title-one text-center text-lg-start md-mb-40 pe-xl-5">
                     <h3 className="text-white m0">List your <span>property{style ? "" : <Image src={titleShape} alt="" className="lazy-img" />}</span> with Property Planet.</h3>
                  </div>
               </div>
               <div className="col-lg-6">
                  <div className="form-wrapper me-auto ms-auto me-lg-0">
                     {/* Was an email form whose submit did nothing (preventDefault),
                         so the address was silently thrown away. */}
                     <div className="text-center text-lg-start">
                        <Link href="/seller/register" className={`pp-card-btn pp-card-btn--primary d-inline-flex px-4 ${style ? "rounded-0" : ""}`}>
                           Get started — it&apos;s free
                        </Link>
                     </div>
                     <div className="fs-16 mt-10 text-white">Already a seller? <Link href="/seller/login">Sign in.</Link></div>
                  </div>
               </div>
            </div>
         </div>
      </div>
   )
}

export default FancyBanner
