// src/app/auth/complete-profile/page.tsx
//
// Landing page for the buyer phone-completion gate. This page itself is
// outside src/middleware.ts's matcher (["/admin/:path*", "/dashboard/:path*"])
// so it can never be redirected to itself in a loop -- but it still fully
// re-derives auth state server-side here rather than trusting that a
// buyer with a null phone is the only way to arrive, matching the
// fail-closed pattern used by requireAdmin()/requireDashboardUser().
//
// - Not logged in            -> "/" (no standalone /login route; login is
//                                the LoginModal, same convention as every
//                                other auth redirect in this app).
// - Logged in, not a buyer   -> away to that role's own home. Sellers/
//                                admins never see this screen.
// - Buyer, phone already set -> "/dashboard/dashboard-index". Ensures a
//                                buyer never sees this screen again once
//                                completed, even via direct URL.
// - Buyer, phone still null  -> render the form.

import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth/session";
import CompleteProfile from "@/components/inner-pages/complete-profile";

export const metadata = {
   title: "Property Planet — Complete Your Profile",
};

const CompleteProfilePage = async () => {
   const ctx = await getAuthContext();

   if (!ctx) {
      redirect("/");
   }

   if (ctx.role === "admin") {
      redirect("/admin");
   }

   if (ctx.role === "seller") {
      redirect("/dashboard/dashboard-index");
   }

   // ctx.role === "buyer" from here on.
   if (ctx.phone) {
      redirect("/dashboard/dashboard-index");
   }

   return <CompleteProfile />;
};

export default CompleteProfilePage;
