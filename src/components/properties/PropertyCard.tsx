import Image from "next/image";
import Link from "next/link";
import { Property } from "./data/types";
import FavouriteButton from "./FavouriteButton";

const PropertyCard = ({ item, isFavourited }: { item: Property; isFavourited?: boolean }) => {
   return (
      <div className="col-md-6 col-lg-4 d-flex mb-50 wow fadeInUp">
         <div className="listing-card-one border-25 h-100 w-100">
            <div className="img-gallery p-15">
               <div className="position-relative border-25 overflow-hidden">
                  {item.tag && <div className="tag border-25">{item.tag}</div>}
                  <FavouriteButton propertyId={item.id} initiallyFavourited={isFavourited} />
                  {item.isDemo && (
                     <div
                        className="tag border-25"
                        style={{ left: "auto", right: 15, background: "#6c757d" }}
                     >
                        Demo
                     </div>
                  )}
                  <Link href={`/properties/${item.slug}`} className="d-block">
                     {item.images[0] ? (
                        <Image
                           src={item.images[0]}
                           alt={item.title}
                           width={600}
                           height={400}
                           className="w-100"
                        />
                     ) : (
                        <div
                           className="w-100 d-flex align-items-center justify-content-center bg-light text-muted"
                           style={{ aspectRatio: "3 / 2" }}
                        >
                           Photos coming soon
                        </div>
                     )}
                  </Link>
               </div>
            </div>

            <div className="property-info p-25">
               <Link href={`/properties/${item.slug}`} className="title tran3s">
                  {item.title}
               </Link>
               <div className="address">{item.address}</div>
               <ul className="style-none feature d-flex flex-wrap align-items-center justify-content-between">
                  {item.sqft && (
                     <li className="d-flex align-items-center">
                        <span className="fs-16">{item.sqft} sqft</span>
                     </li>
                  )}
                  {typeof item.bed === "number" && (
                     <li className="d-flex align-items-center">
                        <span className="fs-16">{item.bed} bed</span>
                     </li>
                  )}
                  {typeof item.bath === "number" && (
                     <li className="d-flex align-items-center">
                        <span className="fs-16">{item.bath} bath</span>
                     </li>
                  )}
               </ul>
               <div className="pl-footer top-border d-flex align-items-center justify-content-between">
                  <strong className="price fw-500 color-dark">
                     ₹{item.price.toLocaleString("en-IN")}
                     {item.priceUnit && <sub>{item.priceUnit}</sub>}
                  </strong>
                  <Link href={`/properties/${item.slug}`} className="btn-four rounded-circle">
                     <i className="bi bi-arrow-up-right"></i>
                  </Link>
               </div>
            </div>
         </div>
      </div>
   );
};

export default PropertyCard;
