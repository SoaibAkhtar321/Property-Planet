"use client"
import DashboardHeaderTwo from "@/layouts/headers/dashboard/DashboardHeaderTwo"
import Link from "next/link"

// Phase 4I: this page used to render a full "Edit & Update" profile form
// (First/Last Name, Email, Phone, a Password field) pre-filled with demo
// placeholder text ("Rashed" / "Kabir" / a misspelled sample email) and a
// "Save" button that was a dead `href="#"` link -- none of it read or
// wrote real data, and it duplicated the fields /dashboard/profile
// already edits for real. That's removed; this page now only keeps its
// one genuine, real feature -- the entry point into Change Password.
const AccountSettingBody = () => {
   return (

      <div className="dashboard-body">
         <div className="position-relative">
            <DashboardHeaderTwo title="Account Settings" />
            <h2 className="main-title d-block d-lg-none">Account Settings</h2>
            <div className="bg-white card-box border-20">
               <h4 className="dash-title-three">Password</h4>
               <p className="mb-20">
                  Manage your account password. Profile details like your name and phone number are
                  edited from your <Link href="/dashboard/profile">Profile</Link> page.
               </p>
               <Link href="/dashboard/account-settings/password-change" className="dash-btn-two tran3s">
                  Change Password
               </Link>
            </div>
         </div>
      </div>
   )
}

export default AccountSettingBody
