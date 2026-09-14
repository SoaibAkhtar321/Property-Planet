import FavouriteBody from './FavouriteBody';
import { Property } from "@/components/properties/data/types";

const DashboardFavourite = ({ properties }: { properties: Property[] }) => {
   return (
      <>
         <FavouriteBody properties={properties} />
      </>
   )
}

export default DashboardFavourite;
