import PropertyList from "@/components/dashboard/properties-list";
import Wrapper from "@/layouts/Wrapper";
import { requireRole } from "@/lib/auth/session";

export const metadata = {
   title: "Property Planet — Dashboard Property List",
};
const index = async () => {
   await requireRole(["seller"]);

   return (
      <Wrapper>
         <PropertyList />
      </Wrapper>
   )
}

export default index