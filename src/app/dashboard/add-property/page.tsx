import DashboardAddProperty from "@/components/dashboard/add-property";
import Wrapper from "@/layouts/Wrapper";
import { requireRole } from "@/lib/auth/session";

export const metadata = {
   title: "Property Planet — Dashboard Add Property",
};

const index = async ({ searchParams }: { searchParams: { error?: string } }) => {
   await requireRole(["seller"]);
   const { error } = searchParams;

   return (
      <Wrapper>
         <DashboardAddProperty error={error} />
      </Wrapper>
   )
}

export default index
