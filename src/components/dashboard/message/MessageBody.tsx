import DashboardHeaderTwo from "@/layouts/headers/dashboard/DashboardHeaderTwo"
import EnquiriesList from "./EnquiriesList"
import SellerLeadsList from "./SellerLeadsList"
import { MyEnquiry } from "@/lib/leads/queries"
import { SellerLead } from "@/lib/leads/sellerQueries"

const MessageBody = ({ enquiries, sellerLeads }: { enquiries: MyEnquiry[]; sellerLeads?: SellerLead[] }) => {
   return (
      <div className="dashboard-body">
         <div className="position-relative">
            <DashboardHeaderTwo title="Message" />
            <h2 className="main-title d-block d-lg-none">Messages</h2>
            {sellerLeads && <SellerLeadsList leads={sellerLeads} />}
            {sellerLeads && <h4 className="dash-title-three mb-20">My enquiries</h4>}
            <EnquiriesList enquiries={enquiries} />
         </div>
      </div>
   )
}

export default MessageBody
