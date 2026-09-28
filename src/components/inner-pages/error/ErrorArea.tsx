import Image from "next/image"
import Link from "next/link"

import titleShape from "@/assets/images/shape/title_shape_02.svg"
import errorImg from "@/assets/images/assets/ils_08.svg"

type ErrorAreaProps = {
   lead?: string
   heading?: string
   message?: string
}

const ErrorArea = ({
   lead = "Oops!",
   heading = "Page not found",
   message = "We couldn't find the page you were looking for. It may have been moved, removed, or the link may be mistyped. You can head back to the homepage or browse our available properties.",
}: ErrorAreaProps) => {
   return (
      <div className="error-section position-relative z-1 bg-pink">
         <div className="container">
            <div className="row">
               <div className="col-xxl-8 col-xl-6 col-lg-7 col-md-8 m-auto">
                  <div className="title-one text-center mb-75 lg-mb-20 wow fadeInUp">
                     <h3><span>{lead} <Image src={titleShape} alt="" className="lazy-img" /></span>{heading}</h3>
                     <p className="fs-20 pb-45">{message}</p>
                     <div className="d-flex flex-wrap justify-content-center gap-3">
                        <Link href="/" className="btn-five sm fw-normal text-uppercase">Back to home</Link>
                        {/* Was `btn-four`, which is the 50x50px icon-only square: the label
                             overflowed it and rendered as white text on a tiny black box.
                             `btn-two` is the full-size green button (same radius/height as
                             btn-five), so the label has room and is clearly visible. */}
                        <Link
                           href="/properties"
                           className="btn-two fw-normal text-uppercase"
                           style={{ fontSize: 14, padding: "0 30px", lineHeight: "55px", minWidth: 150 }}
                        >
                           Browse properties
                        </Link>
                     </div>
                  </div>
               </div>
            </div>
         </div>
         <Image src={errorImg} alt="" className="lazy-img w-100 position-absolute bottom-0 start-0 z-n1" />
      </div>
   )
}

export default ErrorArea
