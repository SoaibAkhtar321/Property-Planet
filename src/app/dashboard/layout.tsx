import { requireDashboardUser } from "@/lib/auth/session";

// Every /dashboard/** request already passes through src/middleware.ts
// before reaching here. This call is defense-in-depth, not a duplicate
// gate — mirrors src/app/admin/layout.tsx + requireAdmin() exactly.
//
// This only guarantees "authenticated user with a valid profile". The
// small number of seller-only pages (add-property, properties-list) add
// their own requireRole(["seller"]) check on top of this, the same way
// individual admin server actions each call requireAdmin() again.
// Same reasoning as src/app/admin/layout.tsx: private buyer/seller area,
// never indexed.
export const metadata = {
   robots: { index: false, follow: false },
};

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
   await requireDashboardUser();

   return <>{children}</>;
}
