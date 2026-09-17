import feature_data from "@/data/home-data/FeatureData";
import Image from "next/image";
import Link from "next/link";
import BLockFeatureThree from "./BLockFeatureThree";

import featureShape from "@/assets/images/shape/shape_21.svg";

interface ContentType {
   title: JSX.Element;
   desc: string;
}

const content_data: ContentType = {
   title: (<>How our clients get <i>benefited</i> by us</>),
   desc: "“Found the right plot for my investment, hassle-free!”",
}
const { title, desc } = content_data;

const BLockFeatureTwo = () => {
   return (
      <div className="block-feature-seven position-relative z-1 mt-150 xl-mt-120">
         <div className="container">
            <div className="position-relative">
               <div className="text-center wow fadeInUp">
                  <div className="title-one mb-30 lg-mb-20">
                     <h2 className="font-garamond">{title}</h2>
                     <p className="fs-24 mt-xs">{desc}</p>
                  </div>
               </div>

               <div className="wrapper position-relative z-1 mt-45 lg-mt-20 mb-100 lg-mb-50">
                  <div className="row">
                     {feature_data.filter((items) => items.page === "home_two_feature_2").map((item) => (
                        <div key={item.id} className="col-lg-4 col-md-6 wow fadeInUp" data-wow-delay={item}>
                           <div className="card-style-two overflow-hidden position-relative z-1 mt-30">
                              {item.imgUrl ? (
                                 <Image src={item.imgUrl} alt="" width={457} height={571} className="lazy-img w-100 tran5s" />
                              ) : (
                                 <Image src={item.img ? item.img : ""} alt="" className="lazy-img w-100 tran5s" />
                              )}
                              <div className="content text-center">
                                 <h5 className="mb-25">{item.title}</h5>
                                 <div className="btn tran3s fw-500 text-uppercase">{item.tag}</div>
                                 <Link href="/properties" className="stretched-link"></Link>
                              </div>
                           </div>
                        </div>
                     ))}
                  </div>
                  <Image src={featureShape} alt="" className="lazy-img shapes shape_01" />
               </div>
               <BLockFeatureThree />
            </div>
         </div>
      </div>
   )
}

export default BLockFeatureTwo;
