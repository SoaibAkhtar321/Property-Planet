import DashboardMessage from "@/components/dashboard/message";
import Wrapper from "@/layouts/Wrapper";
import { requireDashboardUser } from "@/lib/auth/session";
import { getMyEnquiries } from "@/lib/leads/queries";

export const dynamic = "force-dynamic";

export const metadata = {
   title: "Property Planet — Dashboard Message",
};

const index = async () => {
   await requireDashboardUser();
   const enquiries = await getMyEnquiries();

   return (
      <Wrapper>
         <DashboardMessage enquiries={enquiries} />
      </Wrapper>
   )
}

export default index
