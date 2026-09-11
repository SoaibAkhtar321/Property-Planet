import DashboardAddProperty from "@/components/dashboard/add-property";
import Wrapper from "@/layouts/Wrapper";
import { requireRole } from "@/lib/auth/session";

export const metadata = {
   title: "Property Planet — Dashboard Add Property",
};
const index = async () => {
   await requireRole(["seller"]);

   return (
      <Wrapper>
         <DashboardAddProperty />
      </Wrapper>
   )
}

export default index