import DashboardHeaderOne from "@/layouts/headers/dashboard/DashboardHeaderOne"
import MessageBody from "./MessageBody"
import { MyEnquiry } from "@/lib/leads/queries"
import { SellerLead } from "@/lib/leads/sellerQueries"

const DashboardMessage = ({ enquiries, sellerLeads }: { enquiries: MyEnquiry[]; sellerLeads?: SellerLead[] }) => {
   return (
      <>
         <DashboardHeaderOne />
         <MessageBody enquiries={enquiries} sellerLeads={sellerLeads} />
      </>
   )
}

export default DashboardMessage
