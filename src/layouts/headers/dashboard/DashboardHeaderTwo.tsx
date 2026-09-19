"use client"
import Image from "next/image"
import Link from "next/link"
import Notification from "./Notification";
import Profile from "./Profile";
import { useEffect, useState } from "react";
import DashboardHeaderOne from "./DashboardHeaderOne";
import { createClient } from "@/lib/supabase/client";

import dashboardIcon_2 from "@/assets/images/dashboard/icon/icon_11.svg";
import dashboardAvatar from "@/assets/images/dashboard/avatar_01.jpg";

const DashboardHeaderTwo = ({title}:any) => {

   const [isActive, setIsActive] = useState<boolean>(false);

   // Phase 7: the badge-pill dot used to render unconditionally (CSS-only),
   // implying there was always something unread even when Notification.tsx
   // was static demo content. Now it only shows when there's a real unread
   // row in `notifications` for this user.
   const [unreadCount, setUnreadCount] = useState(0);

   // "Add Listing" is a seller-only action (it opens the property-creation
   // flow) -- it must not be shown to buyers. Same read-only, client-side
   // role check as DashboardHeaderOne.tsx, permitted by the existing
   // "users can read own profile" RLS policy (0001_profiles.sql). Does not
   // change role assignment or enforcement anywhere.
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

   return (
      <>
         <header className="dashboard-header">
            <div className="d-flex align-items-center justify-content-end">
               <h4 className="m0 d-none d-lg-block">{title}</h4>
               <button onClick={() => setIsActive(true)} className="dash-mobile-nav-toggler d-block d-md-none me-auto">
                  <span></span>
               </button>
               {/* Phase 4: removed a "Search here.." box that did nothing --
                   its form onSubmit was e.preventDefault() with no search
                   implementation behind it anywhere in the dashboard. Rather
                   than leave dead UI in every dashboard page's header, it's
                   removed until a real dashboard search exists to wire it to. */}
               <div className="profile-notification position-relative dropdown-center ms-3 ms-md-5 me-4">
                  <button className="noti-btn dropdown-toggle" type="button" id="notification-dropdown" data-bs-toggle="dropdown" data-bs-auto-close="outside" aria-expanded="false">
                     <Image src={dashboardIcon_2} alt="" className="lazy-img" />
                     {unreadCount > 0 && <div className="badge-pill"></div>}
                  </button>
                  <Notification onUnreadCountChange={setUnreadCount} />
               </div>
               {isSeller && (
                  <div className="d-none d-md-block me-3">
                     {/* Phase 4 fix: was href="/add-property" (no /dashboard
                         prefix) -- that route doesn't exist, so this button
                         404'd for every seller who clicked it. */}
                     <Link href="/dashboard/add-property" className="btn-two"><span>Add Listing</span> <i className="fa-thin fa-arrow-up-right"></i></Link>
                  </div>
               )}
               <div className="user-data position-relative">
                  <button className="user-avatar online position-relative rounded-circle dropdown-toggle" type="button" id="profile-dropdown" data-bs-toggle="dropdown" data-bs-auto-close="outside" aria-expanded="false">
                     <Image src={dashboardAvatar} alt="" className="lazy-img" />
                  </button>
                  <Profile />
               </div>
            </div>
         </header>
         <DashboardHeaderOne isActive={isActive} setIsActive={setIsActive} />
      </>
   )
}

export default DashboardHeaderTwo
