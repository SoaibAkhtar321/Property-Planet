import DashboardMessage from "@/components/dashboard/message";
import Wrapper from "@/layouts/Wrapper";
import { requireDashboardUser } from "@/lib/auth/session";
import { getMyEnquiries } from "@/lib/leads/queries";
import { getSellerLeads } from "@/lib/leads/sellerQueries";

export const dynamic = "force-dynamic";

export const metadata = {
   title: "Property Planet — Dashboard Message",
};

const index = async () => {
   const ctx = await requireDashboardUser();
   const enquiries = await getMyEnquiries();
   // Sellers also see enquiries on their own properties (buyer name only --
   // contact details are admin-only, enforced by the seller_leads view).
   const sellerLeads = ctx.role === "seller" ? await getSellerLeads() : undefined;

   return (
      <Wrapper>
         <DashboardMessage enquiries={enquiries} sellerLeads={sellerLeads} />
      </Wrapper>
   )
}

export default index
