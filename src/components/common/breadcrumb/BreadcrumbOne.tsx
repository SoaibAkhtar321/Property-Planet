import Image from "next/image"
import Link from "next/link"

import breadcrumbImg from "@/assets/images/assets/ils_07.svg"

const BreadcrumbOne = ({ title, sub_title, style, link, link_title }: any) => {
   return (
      <div className="inner-banner-one inner-banner bg-pink text-center z-1 pt-160 lg-pt-130 pb-160 xl-pb-120 md-pb-80 position-relative">
         <div className="container">
            {/* SEO fix (Section 17 — Heading Structure): this was an <h3> —
                shared by /faq, /terms-of-service and /privacy-policy, none of
                which had an <h1> anywhere else on the page. Safe to promote
                here since none of the three has a conflicting heading. */}
            <h1 className="mb-35 xl-mb-20 pt-15">{title}</h1>
            <ul className="theme-breadcrumb style-none d-inline-flex align-items-center justify-content-center position-relative z-1 bottom-line">
               <li><Link href="/">Home</Link></li>
               <li>/</li>
               {style && <>
                  <li><Link href={link}>{link_title}</Link></li>
                  <li>/</li>
               </>}
               <li>{sub_title}</li>
            </ul>
         </div>
         <Image src={breadcrumbImg} alt="" className="lazy-img shapes w-100 illustration" />
      </div>
   )
}

export default BreadcrumbOne;
