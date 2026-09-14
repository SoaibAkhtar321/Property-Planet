import DashboardFavourite from "@/components/dashboard/favourites";
import Wrapper from "@/layouts/Wrapper";
import { requireDashboardUser } from "@/lib/auth/session";
import { getFavouriteProperties } from "@/lib/properties/queries";

export const dynamic = "force-dynamic";

export const metadata = {
   title: "Property Planet — Dashboard Favourite",
};

const index = async () => {
   const ctx = await requireDashboardUser();
   const properties = await getFavouriteProperties(ctx.userId);

   return (
      <Wrapper>
         <DashboardFavourite properties={properties} />
      </Wrapper>
   )
}

export default index