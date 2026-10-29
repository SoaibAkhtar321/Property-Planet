import DashboardEditProperty from "@/components/dashboard/edit-property";
import Wrapper from "@/layouts/Wrapper";
import { requireRole } from "@/lib/auth/session";

export const metadata = {
   title: "Property Planet — Dashboard Edit Property",
};

const index = async (
   props: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }
) => {
   const searchParams = await props.searchParams;
   const params = await props.params;
   await requireRole(["seller"]);

   return (
      <Wrapper>
         <DashboardEditProperty id={params.id} error={searchParams.error} />
      </Wrapper>
   )
}

export default index
