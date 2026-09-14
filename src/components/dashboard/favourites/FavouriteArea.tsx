"use client"
import { Property } from "@/components/properties/data/types";
import PropertyCard from "@/components/properties/PropertyCard";

const FavouriteArea = ({ properties }: { properties: Property[] }) => {

   if (properties.length === 0) {
      return (
         <div className="bg-white card-box border-20 p-40 text-center">
            <p className="fs-20 m0">
            You haven&apos;t saved any properties yet. Tap the heart icon on a listing to save it here.
            </p>
         </div>
      );
   }

   return (
      <div className="row gx-xxl-5">
         {properties.map((item) => (
            <PropertyCard key={item.id} item={item} isFavourited />
         ))}
      </div>
   )
}

export default FavouriteArea;
