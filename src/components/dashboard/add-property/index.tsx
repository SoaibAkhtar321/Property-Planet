import AddPropertyBody from "./AddPropertyBody"

// Phase 5 fix: same duplicate-sidebar bug as message/index.tsx -- see that
// file's comment. AddPropertyBody already renders DashboardHeaderTwo,
// which renders the real, correctly wired DashboardHeaderOne itself.
const DashboardAddProperty = ({ error }: { error?: string }) => {
   return (
      <>
         <AddPropertyBody error={error} />
      </>
   )
}

export default DashboardAddProperty
