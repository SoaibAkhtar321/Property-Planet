import Image from "next/image";
import Link from "next/link";
import { Property } from "../data/types";

const SimilarProperties = ({ items }: { items: Property[] }) => {
   if (!items || items.length === 0) return null;

   return (
      <div className="accordion-item">
         <h2 className="accordion-header">
            <button
               className="accordion-button collapsed"
               type="button"
               data-bs-toggle="collapse"
               data-bs-target="#collapseSimilar"
               aria-expanded="false"
               aria-controls="collapseSimilar"
            >
               Similar Properties
            </button>
         </h2>
         <div id="collapseSimilar" className="accordion-collapse collapse">
            <div className="accordion-body">
               <div className="similar-property">
                  <div className="row">
                     {items.map((item) => (
                        <div key={item.id} className="col-md-6 item">
                           <div className="listing-card-one style-three border border-30 sm-mb-40">
                              <div className="img-gallery p-15">
                                 <div className="position-relative border-20 overflow-hidden">
                                    {item.tag && <div className="tag bg-white text-dark fw-500 border-20">{item.tag}</div>}
                                    {item.images[0] && (
                                       <Image src={item.images[0]} alt={item.title} width={600} height={400} className="w-100 border-20" />
                                    )}
                                    <Link href={`/properties/${item.slug}`} className="btn-four inverse rounded-circle position-absolute">
                                       <i className="bi bi-arrow-up-right"></i>
                                    </Link>
                                 </div>
                              </div>
                              <div className="property-info pe-4 ps-4">
                                 <Link href={`/properties/${item.slug}`} className="title tran3s">
                                    {item.title}
                                 </Link>
                                 <div className="address m0 pb-5">{item.address}</div>
                                 <div className="pl-footer m0 d-flex align-items-center justify-content-between">
                                    <strong className="price fw-500 color-dark">
                                       ₹{item.price.toLocaleString("en-IN")}
                                       {item.priceUnit && <sub> {item.priceUnit}</sub>}
                                    </strong>
                                 </div>
                              </div>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
            </div>
         </div>
      </div>
   );
};

export default SimilarProperties;
