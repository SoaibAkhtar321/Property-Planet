import DashboardHeaderTwo from "@/layouts/headers/dashboard/DashboardHeaderTwo";
import FavouriteArea from "./FavouriteArea";
import { Property } from "@/components/properties/data/types";

const FavouriteBody = ({ properties }: { properties: Property[] }) => {

   return (
      <div className="dashboard-body">
         <div className="position-relative">
            <DashboardHeaderTwo title="Favourites" />
            <FavouriteArea properties={properties} />
         </div>
      </div>
   )
}

export default FavouriteBody;
