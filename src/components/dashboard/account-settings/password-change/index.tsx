import PasswordChangeBody from "./PasswordChangeBody"
import type { UserRole } from "@/lib/auth/session"

// Phase 5 fix: same duplicate-sidebar bug as message/index.tsx -- see that
// file's comment. PasswordChangeBody already renders DashboardHeaderTwo,
// which renders the real, correctly wired DashboardHeaderOne itself.
const PasswordChange = ({ role }: { role: UserRole }) => {
   return (
      <>
         <PasswordChangeBody role={role} />
      </>
   )
}

export default PasswordChange
