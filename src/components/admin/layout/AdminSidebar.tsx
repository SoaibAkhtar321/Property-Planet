"use client"
import Image from "next/image"
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

import dashboardLogo from "@/assets/images/logo/logo_01.svg";
import iconOverview from "@/assets/images/dashboard/icon/icon_1.svg";
import iconOverviewActive from "@/assets/images/dashboard/icon/icon_1_active.svg";
import iconLeads from "@/assets/images/dashboard/icon/icon_2.svg";
import iconLeadsActive from "@/assets/images/dashboard/icon/icon_2_active.svg";
import iconProperties from "@/assets/images/dashboard/icon/icon_6.svg";
import iconPropertiesActive from "@/assets/images/dashboard/icon/icon_6_active.svg";
import iconUsers from "@/assets/images/dashboard/icon/icon_3.svg";
import iconUsersActive from "@/assets/images/dashboard/icon/icon_3_active.svg";
import iconProjects from "@/assets/images/dashboard/icon/icon_5.svg";
import iconProjectsActive from "@/assets/images/dashboard/icon/icon_5_active.svg";
import iconBlog from "@/assets/images/dashboard/icon/icon_10.svg";
import iconBlogActive from "@/assets/images/dashboard/icon/icon_10_active.svg";
import iconAuditLog from "@/assets/images/dashboard/icon/icon_17.svg";
import iconSettings from "@/assets/images/dashboard/icon/icon_4.svg";
import iconSettingsActive from "@/assets/images/dashboard/icon/icon_4_active.svg";
import iconLogout from "@/assets/images/dashboard/icon/icon_41.svg";

// No dedicated "active" variant ships for icon_17 in public/assets (unlike
// icons 1,2,3,4,5,6,7,8,9,10,39,40, which all have an `_active` counterpart).
// Reuse the base icon for the active state rather than referencing a file
// that doesn't exist — importing a nonexistent asset fails the Next.js/
// webpack build ("Module not found"), which is what broke the "audit
// phase 1" Vercel deployment.
const iconAuditLogActive = iconAuditLog;

interface AdminSidebarProps {
   isActive: boolean;
   setIsActive: (v: boolean) => void;
}

const NAV_ITEMS = [
   { href: "/admin", label: "Overview", icon: iconOverview, iconActive: iconOverviewActive, exact: true },
   { href: "/admin/leads", label: "Leads", icon: iconLeads, iconActive: iconLeadsActive, exact: false },
   { href: "/admin/properties", label: "Properties", icon: iconProperties, iconActive: iconPropertiesActive, exact: false },
   { href: "/admin/users", label: "Users", icon: iconUsers, iconActive: iconUsersActive, exact: false },
   { href: "/admin/projects", label: "Projects", icon: iconProjects, iconActive: iconProjectsActive, exact: false },
   { href: "/admin/blog", label: "Blog", icon: iconBlog, iconActive: iconBlogActive, exact: false },
   { href: "/admin/audit-log", label: "Audit Log", icon: iconAuditLog, iconActive: iconAuditLogActive, exact: false },
   { href: "/admin/settings", label: "Settings", icon: iconSettings, iconActive: iconSettingsActive, exact: false },
];

// Mirrors src/layouts/headers/dashboard/DashboardHeaderOne.tsx's structure
// and CSS classes (dash-aside-navbar / dasboard-main-nav) so the Admin
// area reads as the same product instead of a separate template. Admin
// nav has no role branching (every /admin/** viewer is already an admin,
// enforced server-side by requireAdmin()), so this stays purely
// presentational.
const AdminSidebar = ({ isActive, setIsActive }: AdminSidebarProps) => {
   const pathname = usePathname();
   const router = useRouter();

   const handleLogout = async () => {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/");
      router.refresh();
   };

   const isItemActive = (href: string, exact: boolean) =>
      exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

   return (
      <aside className={`dash-aside-navbar ${isActive ? "show" : ""}`}>
         <div className="position-relative">
            <div className="logo d-md-block d-flex align-items-center justify-content-between plr bottom-line pb-30">
               <Link href="/admin">
                  <Image src={dashboardLogo} alt="Property Planet" />
               </Link>
               <button onClick={() => setIsActive(false)} className="close-btn d-block d-md-none">
                  <i className="fa-light fa-circle-xmark"></i>
               </button>
            </div>
            <div className="plr pt-30">
               <div className="nav-title" style={{ paddingLeft: 0 }}>Admin</div>
            </div>
            <nav className="dasboard-main-nav pt-10 pb-30 bottom-line">
               <ul className="style-none">
                  {NAV_ITEMS.map((item) => {
                     const active = isItemActive(item.href, item.exact);
                     return (
                        <li className="plr" key={item.href}>
                           <Link href={item.href} className={`d-flex w-100 align-items-center ${active ? "active" : ""}`}>
                              <Image src={active ? item.iconActive : item.icon} alt="" />
                              <span>{item.label}</span>
                           </Link>
                        </li>
                     );
                  })}
               </ul>
            </nav>
            <div className="plr pt-30 lg-pt-20">
               <Link href="/" className="d-flex w-100 align-items-center mb-15">
                  <div className="icon tran3s d-flex align-items-center justify-content-center rounded-circle"><i className="fa-thin fa-arrow-left"></i></div>
                  <span>Back to Website</span>
               </Link>
               <button type="button" onClick={handleLogout} className="d-flex w-100 align-items-center logout-btn border-0 bg-transparent p-0" style={{ cursor: "pointer" }}>
                  <div className="icon tran3s d-flex align-items-center justify-content-center rounded-circle"><Image src={iconLogout} alt="" /></div>
                  <span>Logout</span>
               </button>
            </div>
         </div>
      </aside>
   )
}

export default AdminSidebar;