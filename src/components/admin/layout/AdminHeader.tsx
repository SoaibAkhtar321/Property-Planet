"use client"
import { useState } from "react";
import AdminSidebar from "./AdminSidebar";

interface AdminHeaderProps {
   title: string;
   adminEmail: string | null;
}

// Mirrors src/layouts/headers/dashboard/DashboardHeaderTwo.tsx (title bar +
// mobile nav toggler + the "dashboard-header" CSS class), minus the
// buyer/seller-only bits (search, notifications, Add Listing) that don't
// apply to the admin area.
const AdminHeader = ({ title, adminEmail }: AdminHeaderProps) => {
   const [isActive, setIsActive] = useState(false);

   return (
      <>
         <header className="dashboard-header">
            <div className="d-flex align-items-center justify-content-between">
               <h4 className="m0 d-none d-lg-block">{title}</h4>
               <button onClick={() => setIsActive(true)} className="dash-mobile-nav-toggler d-block d-md-none me-auto">
                  <span></span>
               </button>
               {adminEmail && (
                  <div className="ms-auto text-end">
                     <span className="d-none d-sm-inline" style={{ fontSize: 14, opacity: 0.6 }}>{adminEmail}</span>
                  </div>
               )}
            </div>
         </header>
         <AdminSidebar isActive={isActive} setIsActive={setIsActive} />
      </>
   )
}

export default AdminHeader;