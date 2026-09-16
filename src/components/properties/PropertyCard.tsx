import Image from "next/image";
import Link from "next/link";
import { Property } from "./data/types";
import FavouriteButton from "./FavouriteButton";
import InquiryButton from "@/components/inquiry/InquiryButton";

// Phase 20 rework of the card:
//  - Height: the image is pinned to a fixed 4:3 ratio and the info block
//    uses one tighter padding scale, so every card in a row is the same
//    height and none of them is half a screen tall on mobile.
//  - The "For Sale / For Rent" line is gone. Property Planet sells plots,
//    land and homes; rent is not a supported product, so the public card
//    no longer advertises a listing type and instead leads with the
//    property type, which is what a buyer actually scans for.
//  - Two explicit actions: See Details (detail page) and Send Inquiry
//    (opens the universal inquiry dialog with this property already
//    selected, so nobody has to open the detail page just to enquire).
//
// Hierarchy: Send Inquiry is the filled primary, See Details the outlined
// secondary. Both are real link/button elements with accessible names that
// include the property title.

const PropertyCard = ({ item, isFavourited }: { item: Property; isFavourited?: boolean }) => {
   const facts = [
      item.sqft ? `${item.sqft} sqft` : null,
      typeof item.bed === "number" ? `${item.bed} bed` : null,
      typeof item.bath === "number" ? `${item.bath} bath` : null,
   ].filter(Boolean) as string[];

   return (
      <div className="col-md-6 col-lg-4 d-flex mb-30 wow fadeInUp">
         <div className="pp-card h-100 w-100">
            <div className="pp-card__media">
               {item.tag && <span className="pp-card__tag">{item.tag}</span>}
               {item.isDemo && <span className="pp-card__tag pp-card__tag--muted">Demo</span>}
               <FavouriteButton propertyId={item.id} initiallyFavourited={isFavourited} />
               <Link href={`/properties/${item.slug}`} className="pp-card__media-link" tabIndex={-1} aria-hidden="true">
                  {item.images[0] ? (
                     <Image src={item.images[0]} alt="" width={600} height={450} className="pp-card__img" />
                  ) : (
                     <span className="pp-card__img pp-card__img--empty">Photos coming soon</span>
                  )}
               </Link>
            </div>

            <div className="pp-card__body">
               <Link href={`/properties/${item.slug}`} className="pp-card__title">
                  {item.title}
               </Link>
               <p className="pp-card__meta">{item.address}</p>

               <div className="pp-card__facts">
                  <span className="pp-card__type">{item.propertyType}</span>
                  {facts.map((fact) => (
                     <span key={fact}>{fact}</span>
                  ))}
               </div>

               <div className="pp-card__price">
                  ₹{item.price.toLocaleString("en-IN")}
                  {item.priceUnit && <sub>{item.priceUnit}</sub>}
               </div>

               <div className="pp-card__actions">
                  <Link
                     href={`/properties/${item.slug}`}
                     className="pp-card-btn pp-card-btn--ghost"
                     aria-label={`See details for ${item.title}`}
                  >
                     See Details
                  </Link>
                  <InquiryButton kind="property" id={item.id} title={item.title} subtitle={item.address} />
               </div>
            </div>
         </div>
      </div>
   );
};

export default PropertyCard;
