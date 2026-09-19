import MessageBody from "./MessageBody"
import { MyEnquiry } from "@/lib/leads/queries"
import { SellerLead } from "@/lib/leads/sellerQueries"

// Phase 5 fix: this used to also render a standalone <DashboardHeaderOne />
// here, with no isActive/setIsActive props. MessageBody already renders
// DashboardHeaderTwo, which renders the real, correctly wired
// DashboardHeaderOne (sidebar) itself -- so this was a second, broken copy
// of the sidebar stacked on the page. Its "close" button called an
// undefined setIsActive and would throw if tapped on mobile.
const DashboardMessage = ({ enquiries, sellerLeads }: { enquiries: MyEnquiry[]; sellerLeads?: SellerLead[] }) => {
   return (
      <>
         <MessageBody enquiries={enquiries} sellerLeads={sellerLeads} />
      </>
   )
}

export default DashboardMessage
