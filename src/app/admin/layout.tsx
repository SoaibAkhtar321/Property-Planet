import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";

// Every /admin/** request already passes through src/middleware.ts before
// reaching here. This call is defense-in-depth, not a duplicate gate —
// see lib/admin/auth.ts's comment for why both layers are kept.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
   await requireAdmin();

   return (
      <div className="d-flex" style={{ minHeight: "100vh" }}>
         <nav
            className="p-4 border-end"
            style={{ width: 220, flexShrink: 0, background: "#f8f9fa" }}
         >
            <div className="fw-bold mb-4">Property Planet Admin</div>
            <ul className="list-unstyled d-flex flex-column gap-2">
               <li>
                  <Link href="/admin/projects">Projects</Link>
               </li>
            </ul>
         </nav>
         <main className="flex-grow-1 p-4">{children}</main>
      </div>
   );
}
