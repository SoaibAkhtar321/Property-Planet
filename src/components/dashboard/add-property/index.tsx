import DashboardHeaderOne from "@/layouts/headers/dashboard/DashboardHeaderOne"
import AddPropertyBody from "./AddPropertyBody"

const DashboardAddProperty = ({ error }: { error?: string }) => {
   return (
      <>
         <DashboardHeaderOne />
         <AddPropertyBody error={error} />
      </>
   )
}

export default DashboardAddProperty
