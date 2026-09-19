"use client"
import Image from "next/image"
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from "@/lib/supabase/client";

import BrandLogo from "@/components/common/BrandLogo";
import dashboardIconActive_1 from "@/assets/images/dashboard/icon/icon_1_active.svg";
import dashboardIcon_1 from "@/assets/images/dashboard/icon/icon_1.svg";
import dashboardIconActive_2 from "@/assets/images/dashboard/icon/icon_2_active.svg";
import dashboardIcon_2 from "@/assets/images/dashboard/icon/icon_2.svg";
import dashboardIconActive_3 from "@/assets/images/dashboard/icon/icon_3_active.svg";
import dashboardIcon_3 from "@/assets/images/dashboard/icon/icon_3.svg";
import dashboardIconActive_4 from "@/assets/images/dashboard/icon/icon_4_active.svg";
import dashboardIcon_4 from "@/assets/images/dashboard/icon/icon_4.svg";
import dashboardIconActive_6 from "@/assets/images/dashboard/icon/icon_6_active.svg";
import dashboardIcon_6 from "@/assets/images/dashboard/icon/icon_6.svg";
import dashboardIconActive_7 from "@/assets/images/dashboard/icon/icon_7_active.svg";
import dashboardIcon_7 from "@/assets/images/dashboard/icon/icon_7.svg";
import dashboardIconActive_8 from "@/assets/images/dashboard/icon/icon_8_active.svg";
import dashboardIcon_8 from "@/assets/images/dashboard/icon/icon_8.svg";
import dashboardIcon_11 from "@/assets/images/dashboard/icon/icon_41.svg";

const DashboardHeaderOne = ({ isActive, setIsActive }: any) => {
   const pathname = usePathname();
   const router = useRouter();

   // The "Listing" nav section (My Properties / Add New Property) is
   // seller-only -- src/middleware.ts and requireRole() already block a
   // buyer from those pages server-side, but the sidebar itself used to
   // show the links to every role regardless, which made a freshly
   // signed-up buyer's dashboard look like a seller dashboard. This is
   // read-only, client-side, and permitted by the existing "users can
   // read own profile" RLS policy (0001_profiles.sql) -- it does not
   // change how role is assigned or enforced anywhere.
   const [isSeller, setIsSeller] = useState(false);

   useEffect(() => {
      let cancelled = false;
      const supabase = createClient();

      (async () => {
         const { data: { user } } = await supabase.auth.getUser();
         if (!user) return;

         const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .maybeSingle();

         if (!cancelled && profile?.role === "seller") {
            setIsSeller(true);
         }
      })();

      return () => { cancelled = true; };
   }, []);

   const handleLogout = async () => {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/");
      router.refresh();
   };

   return (
      <aside className={`dash-aside-navbar ${isActive ? "show" : ""}`}>
         <div className="position-relative">
            <div className="logo d-md-block d-flex align-items-center justify-content-between plr bottom-line pb-30">
               <Link href="/dashboard-index">
                  <BrandLogo size="menu" />
               </Link>
               <button onClick={() => setIsActive(false)} className="close-btn d-block d-md-none"><i className="fa-light fa-circle-xmark"></i></button>
            </div>
            <nav className="dasboard-main-nav pt-30 pb-30 bottom-line">
               <ul className="style-none">
                  <li className="plr"><Link href="/dashboard/dashboard-index" className={`d-flex w-100 align-items-center ${pathname === '/dashboard/dashboard-index' ? 'active' : ''}`}>
                     <Image src={pathname === '/dashboard/dashboard-index' ? dashboardIconActive_1 : dashboardIcon_1} alt="" />
                     <span>Dashboard</span>
                  </Link></li>
                  <li className="plr"><Link href="/dashboard/message" className={`d-flex w-100 align-items-center ${pathname === '/dashboard/message' ? 'active' : ''}`}>
                     <Image src={pathname === '/dashboard/message' ? dashboardIconActive_2 : dashboardIcon_2} alt="" />
                     <span>Message</span>
                  </Link></li>
                  <li className="bottom-line pt-30 lg-pt-20 mb-40 lg-mb-30"></li>
                  <li><div className="nav-title">Profile</div></li>
                  <li className="plr"><Link href="/dashboard/profile" className={`d-flex w-100 align-items-center ${pathname === '/dashboard/profile' ? 'active' : ''}`}>
                     <Image src={pathname === '/dashboard/profile' ? dashboardIconActive_3 : dashboardIcon_3} alt="" />
                     <span>Profile</span>
                  </Link></li>
                  <li className="plr"><Link href="/dashboard/account-settings" className={`d-flex w-100 align-items-center ${pathname === '/dashboard/account-settings' ? 'active' : ''}`}>
                     <Image src={pathname === '/dashboard/account-settings' ? dashboardIconActive_4 : dashboardIcon_4} alt="" />
                     <span>Account Settings</span>
                  </Link></li>
                  {isSeller && (
                     <>
                        <li className="bottom-line pt-30 lg-pt-20 mb-40 lg-mb-30"></li>
                        <li><div className="nav-title">Listing</div></li>
                        <li className="plr"><Link href="/dashboard/properties-list" className={`d-flex w-100 align-items-center ${pathname === '/dashboard/properties-list' ? 'active' : ''}`}>
                           <Image src={pathname === '/dashboard/properties-list' ? dashboardIconActive_6 : dashboardIcon_6} alt="" />
                           <span>My Properties</span>
                        </Link></li>
                        <li className="plr"><Link href="/dashboard/add-property" className={`d-flex w-100 align-items-center ${pathname === '/dashboard/add-property' ? 'active' : ''}`}>
                           <Image src={pathname === '/dashboard/add-property' ? dashboardIconActive_7 : dashboardIcon_7} alt="" />
                           <span>Add New Property</span>
                        </Link></li>
                     </>
                  )}
                  <li className="plr"><Link href="/dashboard/favourites" className={`d-flex w-100 align-items-center ${pathname === '/dashboard/favourites' ? 'active' : ''}`}>
                     <Image src={pathname === '/dashboard/favourites' ? dashboardIconActive_8 : dashboardIcon_8} alt="" />
                     <span>Favourites</span>
                  </Link></li>
               </ul>
            </nav>
            <div className="plr">
               <Link href="/" className="d-flex w-100 align-items-center mb-15">
                  <div className="icon tran3s d-flex align-items-center justify-content-center rounded-circle"><i className="fa-thin fa-arrow-left"></i></div>
                  <span>Back to Website</span>
               </Link>
               <button type="button" onClick={handleLogout} className="d-flex w-100 align-items-center logout-btn border-0 bg-transparent p-0" style={{ cursor: "pointer" }}>
                  <div className="icon tran3s d-flex align-items-center justify-content-center rounded-circle"><Image src={dashboardIcon_11} alt="" /></div>
                  <span>Logout</span>
               </button>
            </div>
         </div>
      </aside>
   )
}

export default DashboardHeaderOne;
