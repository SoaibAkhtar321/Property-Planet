"use client"
// src/layouts/headers/Menu/AuthNav.tsx
//
// Phase 1: session-aware replacement for the hardcoded "Login / Sign up"
// links in HeaderTwo. Presentation only — see src/hooks/useSupabaseUser.ts
// for why this never makes an authorization decision on its own.

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useSupabaseUser } from "@/hooks/useSupabaseUser"
import { createClient } from "@/lib/supabase/client"

interface AuthNavProps {
   style_2?: boolean;
}

const AuthNav = ({ style_2 }: AuthNavProps) => {
   const router = useRouter();
   const { user, role, fullName, loading } = useSupabaseUser();

   const handleLogout = async () => {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/");
      router.refresh();
   };

   if (loading) {
      // Brief, unavoidable moment while the session is resolved client-side.
      // Deliberately renders nothing rather than guessing logged-in vs
      // logged-out, so there is no flash of the wrong state.
      return style_2 ? <li className="d-none d-md-flex me-4 me-xxl-5" style={{ width: 1 }} /> : <li className="d-none d-md-inline-block ms-3 ms-xl-4 me-xl-4" style={{ width: 1 }} />;
   }

   if (!user) {
      return style_2 ? (
         <li>
            <Link href="#" data-bs-toggle="modal" data-bs-target="#loginModal" className="login-btn-two rounded-circle tran3s d-flex align-items-center justify-content-center"><i className="fa-regular fa-lock"></i></Link>
         </li>
      ) : (
         <li className="d-flex align-items-center login-btn-one">
            <i className="fa-regular fa-lock"></i>
            <Link href="#" data-bs-toggle="modal" data-bs-target="#loginModal" className="fw-500 tran3s">
               Login <span className="d-none d-sm-inline-block"> {""} / Sign up</span></Link>
         </li>
      );
   }

   const dashboardHref = role === "admin" ? "/admin" : "/dashboard/dashboard-index";
   const dashboardLabel = role === "admin" ? "Admin Panel" : "Dashboard";
   const displayName = fullName || user.email || "Account";

   if (style_2) {
      return (
         <li className="d-none d-md-flex align-items-center me-4 me-xxl-5">
            <span className="me-3 fw-500">{displayName}</span>
            <Link href={dashboardHref} className="me-3">{dashboardLabel}</Link>
            <button type="button" onClick={handleLogout} style={{ cursor: "pointer" }} className="tran3s border-0 bg-transparent p-0">Logout</button>
         </li>
      );
   }

   return (
      <li className="d-none d-md-flex align-items-center ms-3 ms-xl-4 me-xl-4">
         <span className="me-3 fw-500">{displayName}</span>
         <Link href={dashboardHref} className="me-3 fw-500 tran3s">{dashboardLabel}</Link>
         <button type="button" onClick={handleLogout} style={{ cursor: "pointer" }} className="fw-500 tran3s border-0 bg-transparent p-0">Logout</button>
      </li>
   );
}

export default AuthNav
