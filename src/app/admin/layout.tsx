import { requireAdmin } from "@/lib/admin/auth";
import AdminHeader from "@/components/admin/layout/AdminHeader";

// Every /admin/** request already passes through src/middleware.ts before
// reaching here. This call is defense-in-depth, not a duplicate gate —
// see lib/admin/auth.ts's comment for why both layers are kept.
//
// Phase B: the shell now reuses the same "dashboard-body" / "dash-aside-navbar"
// CSS (public/assets/scss/_dashboard.scss) as the Buyer/Seller dashboard
// instead of raw Bootstrap, so Admin looks like part of the same product.
// Each admin page keeps its own content/markup — only the surrounding
// shell and sidebar changed here.
// Phase 25: admin is behind auth, but a crawler that ever reaches a URL
// under it (a shared link, a redirect chain) must not index it. This is
// belt-and-braces alongside src/middleware.ts, not the access control.
export const metadata = {
   robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
   const session = await requireAdmin();

   return (
      <div className="dashboard-body">
         <div className="position-relative">
            <AdminHeader title="Property Planet Admin" adminEmail={session.email} />
            {children}
         </div>
      </div>
   );
}