"use client"
import { useState } from "react";
import Image from "next/image";
import DashboardHeaderTwo from "@/layouts/headers/dashboard/DashboardHeaderTwo"
import { createClient } from "@/lib/supabase/client";
import type { UserRole } from "@/lib/auth/session";

import OpenEye from "@/assets/images/icon/icon_68.svg";

// Phase 4I: this form used to be entirely unwired -- `onSubmit`
// preventDefault'd and threw the values away, and "Save & Updated" was a
// dead `href="#"` link. Now actually re-authenticates with the current
// password (the only reliable way to confirm it without a server-side
// password check Supabase doesn't expose) and calls
// supabase.auth.updateUser() -- both client calls against the
// RLS-respecting anon client, same as every other buyer/seller-facing
// write in this app; no service-role key involved. Matches the min-8-
// character rule already enforced at seller signup (SellerRegisterForm).
const MIN_PASSWORD_LENGTH = 8;

const PasswordChangeBody = ({ role }: { role: UserRole }) => {
   const [oldPassword, setOldPassword] = useState("");
   const [newPassword, setNewPassword] = useState("");
   const [confirmPassword, setConfirmPassword] = useState("");
   const [error, setError] = useState("");
   const [success, setSuccess] = useState(false);
   const [isSaving, setIsSaving] = useState(false);
   // Three independent toggles -- revealing one of old/new/confirm
   // shouldn't force-reveal the other two.
   const [showOld, setShowOld] = useState(false);
   const [showNew, setShowNew] = useState(false);
   const [showConfirm, setShowConfirm] = useState(false);

   // Buyers sign in via Google OAuth only (see DeleteAccountSection.tsx's
   // comment) and have no password on the account, so this form can never
   // work for them -- showing it would just invite a confusing "wrong
   // password" error. Sellers/admins sign up with email + password.
   if (role === "buyer") {
      return (
         <div className="dashboard-body">
            <div className="position-relative">
               <DashboardHeaderTwo title="Change Password" />
               <div className="bg-white card-box border-20">
                  <p className="m0">
                     Your account signs in with Google, so there&apos;s no separate Property Planet
                     password to change.
                  </p>
               </div>
            </div>
         </div>
      );
   }

   const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setError("");
      setSuccess(false);

      if (!oldPassword || !newPassword || !confirmPassword) {
         setError("Please fill in all three fields.");
         return;
      }
      if (newPassword.length < MIN_PASSWORD_LENGTH) {
         setError(`New password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
         return;
      }
      if (newPassword !== confirmPassword) {
         setError("New password and confirmation do not match.");
         return;
      }

      setIsSaving(true);
      try {
         const supabase = createClient();
         const { data: userData, error: userError } = await supabase.auth.getUser();

         if (userError || !userData?.user?.email) {
            throw new Error("You need to be signed in to change your password.");
         }

         // Confirms the old password is correct before changing anything --
         // Supabase has no direct "verify current password" call, so
         // re-authenticating with it is the standard way to check it.
         const { error: reauthError } = await supabase.auth.signInWithPassword({
            email: userData.user.email,
            password: oldPassword,
         });
         if (reauthError) {
            setError("Current password is incorrect.");
            return;
         }

         const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
         if (updateError) {
            throw updateError;
         }

         setOldPassword("");
         setNewPassword("");
         setConfirmPassword("");
         setSuccess(true);
      } catch (err) {
         console.error("Password change failed:", err);
         setError("Could not change your password. Please try again.");
      } finally {
         setIsSaving(false);
      }
   };

   return (
      <div className="dashboard-body">
         <div className="position-relative">
            <DashboardHeaderTwo title="Change Password" />
            <div className="bg-white card-box border-20">
               <form onSubmit={handleSubmit}>
                  <div className="row">
                     <div className="col-12">
                        <div className="dash-input-wrapper mb-20">
                           <label htmlFor="oldPassword">Old Password*</label>
                           <input
                              type={showOld ? "text" : "password"}
                              id="oldPassword"
                              placeholder="Type current password"
                              value={oldPassword}
                              onChange={(e) => setOldPassword(e.target.value)}
                              autoComplete="current-password"
                              className="pass_log_id"
                           />
                           <span className="placeholder_icon">
                              <span className={`passVicon ${showOld ? "eye-slash" : ""}`}>
                                 <Image
                                    onClick={() => setShowOld((v) => !v)}
                                    onKeyDown={(e) => {
                                       if (e.key === "Enter" || e.key === " ") {
                                          e.preventDefault();
                                          setShowOld((v) => !v);
                                       }
                                    }}
                                    role="button"
                                    tabIndex={0}
                                    aria-pressed={showOld}
                                    src={OpenEye}
                                    alt="Show password"
                                    style={{ cursor: "pointer" }}
                                 />
                              </span>
                           </span>
                        </div>
                     </div>
                     <div className="col-12">
                        <div className="dash-input-wrapper mb-20">
                           <label htmlFor="newPassword">New Password*</label>
                           <input
                              type={showNew ? "text" : "password"}
                              id="newPassword"
                              placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              autoComplete="new-password"
                              className="pass_log_id"
                           />
                           <span className="placeholder_icon">
                              <span className={`passVicon ${showNew ? "eye-slash" : ""}`}>
                                 <Image
                                    onClick={() => setShowNew((v) => !v)}
                                    onKeyDown={(e) => {
                                       if (e.key === "Enter" || e.key === " ") {
                                          e.preventDefault();
                                          setShowNew((v) => !v);
                                       }
                                    }}
                                    role="button"
                                    tabIndex={0}
                                    aria-pressed={showNew}
                                    src={OpenEye}
                                    alt="Show password"
                                    style={{ cursor: "pointer" }}
                                 />
                              </span>
                           </span>
                        </div>
                     </div>
                     <div className="col-12">
                        <div className="dash-input-wrapper mb-20">
                           <label htmlFor="confirmPassword">Confirm Password*</label>
                           <input
                              type={showConfirm ? "text" : "password"}
                              id="confirmPassword"
                              placeholder="Confirm your new password"
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              autoComplete="new-password"
                              className="pass_log_id"
                           />
                           <span className="placeholder_icon">
                              <span className={`passVicon ${showConfirm ? "eye-slash" : ""}`}>
                                 <Image
                                    onClick={() => setShowConfirm((v) => !v)}
                                    onKeyDown={(e) => {
                                       if (e.key === "Enter" || e.key === " ") {
                                          e.preventDefault();
                                          setShowConfirm((v) => !v);
                                       }
                                    }}
                                    role="button"
                                    tabIndex={0}
                                    aria-pressed={showConfirm}
                                    src={OpenEye}
                                    alt="Show password"
                                    style={{ cursor: "pointer" }}
                                 />
                              </span>
                           </span>
                        </div>
                     </div>
                  </div>

                  {error && (
                     <div className="alert alert-danger mb-20" role="alert">
                        {error}
                     </div>
                  )}
                  {success && !isSaving && (
                     <div className="alert alert-success mb-20" role="status">
                        Password updated successfully.
                     </div>
                  )}

                  <div className="button-group d-inline-flex align-items-center">
                     <button type="submit" className="dash-btn-two tran3s" disabled={isSaving}>
                        {isSaving ? "Saving..." : "Save & Updated"}
                     </button>
                  </div>
               </form>
            </div>
         </div>
      </div>
   )
}

export default PasswordChangeBody
