import PasswordChangeBody from "./PasswordChangeBody"

// Phase 5 fix: same duplicate-sidebar bug as message/index.tsx -- see that
// file's comment. PasswordChangeBody already renders DashboardHeaderTwo,
// which renders the real, correctly wired DashboardHeaderOne itself.
const PasswordChange = () => {
   return (
      <>
         <PasswordChangeBody />
      </>
   )
}

export default PasswordChange
