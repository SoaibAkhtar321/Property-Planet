import DashboardHeaderTwo from "@/layouts/headers/dashboard/DashboardHeaderTwo"
import EnquiriesList from "./EnquiriesList"
import { MyEnquiry } from "@/lib/leads/queries"

const MessageBody = ({ enquiries }: { enquiries: MyEnquiry[] }) => {
   return (
      <div className="dashboard-body">
         <div className="position-relative">
            <DashboardHeaderTwo title="Message" />
            <h2 className="main-title d-block d-lg-none">Messages</h2>
            <EnquiriesList enquiries={enquiries} />
         </div>
      </div>
   )
}

export default MessageBody
