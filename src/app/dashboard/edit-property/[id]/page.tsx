import DashboardEditProperty from "@/components/dashboard/edit-property";
import Wrapper from "@/layouts/Wrapper";
import { requireRole } from "@/lib/auth/session";

export const metadata = {
   title: "Property Planet — Dashboard Edit Property",
};

const index = async ({ params, searchParams }: { params: { id: string }; searchParams: { error?: string } }) => {
   await requireRole(["seller"]);

   return (
      <Wrapper>
         <DashboardEditProperty id={params.id} error={searchParams.error} />
      </Wrapper>
   )
}

export default index
