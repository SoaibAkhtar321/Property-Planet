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
      return style_2 ? <li className="d-flex me-2 me-md-4 me-xxl-5" style={{ width: 1 }} /> : <li className="d-inline-block ms-2 ms-md-3 ms-xl-4 me-2 me-xl-4" style={{ width: 1 }} />;
   }

   if (!user) {
      // Phase 2: logged-out visitors no longer get a standalone Login/Sign up
      // button occupying prominent header space -- that action now lives in
      // NavMenu (desktop nav / HeaderOne mobile collapse) and Offcanvas
      // (HeaderTwo mobile menu) instead, both using the same #loginModal
      // trigger. Render nothing here so the header stays focused on
      // discovery for new visitors.
      return null;
   }

   const displayName = fullName || user.email || "Account";

   // Buyer gets Dashboard + Profile. Seller gets those plus listing
   // management — one unified dropdown, since a seller account keeps
   // full buyer functionality rather than switching modes. Admin gets
   // just the admin panel: none of the buyer/seller dashboard routes
   // apply to an admin account.
   const menuItems: { href: string; label: string }[] = [];
   if (role === "admin") {
      menuItems.push({ href: "/admin", label: "Admin Panel" });
   } else {
      menuItems.push({ href: "/dashboard/dashboard-index", label: "My Dashboard" });
      if (role === "seller") {
         menuItems.push({ href: "/dashboard/properties-list", label: "My Properties" });
         menuItems.push({ href: "/dashboard/add-property", label: "Add Listing" });
      }
      menuItems.push({ href: "/dashboard/profile", label: "Profile" });
   }

   const dropdown = (
      <ul className="dropdown-menu dropdown-menu-end">
         {menuItems.map((item) => (
            <li key={item.href}>
               <Link className="dropdown-item" href={item.href}>{item.label}</Link>
            </li>
         ))}
         <li>
            <button type="button" onClick={handleLogout} className="dropdown-item border-0 bg-transparent w-100 text-start" style={{ cursor: "pointer" }}>Logout</button>
         </li>
      </ul>
   );

   const wrapperClass = style_2
      ? "d-flex align-items-center me-2 me-md-4 me-xxl-5 position-relative"
      : "d-flex align-items-center ms-2 ms-md-3 ms-xl-4 me-2 me-xl-4 position-relative";

   const initial = displayName.trim().charAt(0).toUpperCase() || "U";

   return (
      <li className={wrapperClass}>
         <button
            type="button"
            className="auth-avatar-btn rounded-circle border-0 d-flex align-items-center justify-content-center dropdown-toggle"
            id="auth-nav-dropdown"
            data-bs-toggle="dropdown"
            data-bs-auto-close="outside"
            aria-expanded="false"
            aria-label={displayName}
            title={displayName}
         >
            {initial}
         </button>
         {dropdown}
      </li>
   );
}

export default AuthNav
