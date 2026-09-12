import DashboardIndex from "@/components/dashboard/index";
import Wrapper from "@/layouts/Wrapper";
import { requireDashboardUser } from "@/lib/auth/session";
import { getDashboardSummary } from "@/lib/dashboard/queries";

export const metadata = {
   title: "Property Planet — Dashboard Index",
};

const index = async () => {
   // requireDashboardUser() is defense-in-depth alongside src/middleware.ts
   // (same pattern as every other /dashboard/** page), and also gives us
   // the role we need to pick which stats to fetch.
   const ctx = await requireDashboardUser();
   const stats = await getDashboardSummary(ctx);

   return (
      <Wrapper>
         <DashboardIndex stats={stats} />
      </Wrapper>
   )
}

export default index