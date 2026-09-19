import ProfileBody from "./ProfileBody"

// Phase 5 fix: same duplicate-sidebar bug as message/index.tsx -- see that
// file's comment. ProfileBody already renders DashboardHeaderTwo, which
// renders the real, correctly wired DashboardHeaderOne itself.
const DashboardProfile = () => {
   return (
      <>
         <ProfileBody />
      </>
   )
}

export default DashboardProfile
