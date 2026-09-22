import PasswordChange from "@/components/dashboard/account-settings/password-change";
import Wrapper from "@/layouts/Wrapper";
import { requireDashboardUser } from "@/lib/auth/session";

export const metadata = {
   title: "Property Planet — Dashboard Account Password Change",
};

const index = async () => {
   // Phase 4I: this page's form used to be entirely unwired (a dead
   // `href="#"` "Save" link, no Supabase calls at all). Buyers sign in
   // via Google OAuth only and have no password to change (see
   // DeleteAccountSection.tsx's comment) -- only sellers (email/password
   // signup) do. requireDashboardUser() already gives us the role we
   // need to show buyers a clear explanation instead of a form that
   // could never work for them.
   const ctx = await requireDashboardUser();

   return (
      <Wrapper>
         <PasswordChange role={ctx.role} />
      </Wrapper>
   )
}

export default index
