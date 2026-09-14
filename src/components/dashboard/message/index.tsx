import DashboardHeaderOne from "@/layouts/headers/dashboard/DashboardHeaderOne"
import MessageBody from "./MessageBody"
import { MyEnquiry } from "@/lib/leads/queries"

const DashboardMessage = ({ enquiries }: { enquiries: MyEnquiry[] }) => {
   return (
      <>
         <DashboardHeaderOne />
         <MessageBody enquiries={enquiries} />
      </>
   )
}

export default DashboardMessage
