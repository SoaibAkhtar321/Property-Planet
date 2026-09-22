"use client"
import { useState, useEffect } from "react";
import DashboardHeaderTwo from "@/layouts/headers/dashboard/DashboardHeaderTwo";
import Image from "next/image";
import UserAvatarSetting from "./UserAvatarSetting";
import DeleteAccountSection from "./DeleteAccountSection";
import { createClient } from "@/lib/supabase/client";

import avatar_1 from "@/assets/images/dashboard/avatar_02.jpg";

// Phase 4I: this page used to also render a "Social Media" card and an
// "Address & Location" card (with a hardcoded map centered on an unrelated
// city). Neither had a backing `profiles` column, neither ever saved
// anything, and the address card showed the same demo map to every user
// regardless of who they were. Both were unwired template leftovers, not
// real Property Planet features, so they're not rendered here anymore --
// see SocialMediaLink.tsx / AddressAndLocation.tsx for the unused
// originals, left in place but unreferenced. Same reasoning for the old
// "Upload new photo" / "Delete" buttons below: there was no storage
// bucket or write path behind them, so they did nothing when clicked.
// `profiles.avatar_url` (0001_profiles.sql) is real and now actually
// read, but wiring an upload flow for it is a separate, larger phase
// (needs a Storage bucket + policy, not a UI-only fix).

const ProfileBody = () => {
   const [name, setName] = useState("");
   const [email, setEmail] = useState("");
   const [firstName, setFirstName] = useState("");
   const [phoneNumber, setPhoneNumber] = useState("");
   const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
   const [loadError, setLoadError] = useState("");
   const [saveError, setSaveError] = useState("");
   const [saveSuccess, setSaveSuccess] = useState(false);
   const [isSaving, setIsSaving] = useState(false);

   useEffect(() => {
      const supabase = createClient();

      const fetchProfile = async () => {
         try {
            const { data: userData, error: userError } = await supabase.auth.getUser();

            if (userError || !userData?.user) {
               // No active session — nothing to load; leave form blank
               // rather than throwing, since this page assumes an
               // authenticated user is already present.
               setLoadError("You need to be signed in to view your profile.");
               return;
            }

            const user = userData.user;
            setEmail(user.email ?? "");

            const { data: profile, error: profileError } = await supabase
               .from("profiles")
               .select("full_name, phone, avatar_url")
               .eq("id", user.id)
               .maybeSingle();

            if (profileError) {
               throw profileError;
            }

            // profile can legitimately be null for a brand-new user if the
            // handle_new_user() trigger hasn't run yet — fall back safely.
            setName(profile?.full_name ?? "");
            setFirstName(profile?.full_name ?? "");
            setPhoneNumber(profile?.phone ?? "");
            setAvatarUrl(profile?.avatar_url ?? null);
         } catch (error) {
            console.error("Error fetching user data:", error);
            setLoadError("Failed to load your profile. Please try again.");
         }
      };

      fetchProfile();
   }, []);

   const handleSave = async () => {
      setSaveError("");
      setSaveSuccess(false);
      setIsSaving(true);

      try {
         const supabase = createClient();
         const { data: userData, error: userError } = await supabase.auth.getUser();

         if (userError || !userData?.user) {
            throw new Error("You need to be signed in to update your profile.");
         }

         const { error } = await supabase
            .from("profiles")
            .update({
               full_name: firstName,
               phone: phoneNumber,
            })
            .eq("id", userData.user.id);

         if (error) {
            throw error;
         }

         setName(firstName);
         setSaveSuccess(true);
      } catch (error) {
         console.error("Error updating profile:", error);
         setSaveError("Could not save your changes. Please try again.");
      } finally {
         setIsSaving(false);
      }
   };

   return (
      <div className="dashboard-body">
         <div className="position-relative">
            <DashboardHeaderTwo title="Profile" />
            <h2 className="main-title d-block d-lg-none">Profile</h2>
            {loadError && (
               <div className="alert alert-danger mb-20" role="alert">
                  {loadError}
               </div>
            )}

            <div className="bg-white card-box border-20">
               <div className="user-avatar-setting d-flex align-items-center mb-30">
                  <Image
                     src={avatarUrl || avatar_1}
                     alt="Profile photo"
                     className="lazy-img user-img"
                     width={80}
                     height={80}
                     unoptimized={Boolean(avatarUrl)}
                  />
               </div>

               <UserAvatarSetting
                  name={name}
                  email={email}
                  firstName={firstName} setFirstName={setFirstName}
                  phoneNumber={phoneNumber} setPhoneNumber={setPhoneNumber}
               />
            </div>

            {saveError && (
               <div className="alert alert-danger mt-20 mb-0" role="alert">
                  {saveError}
               </div>
            )}
            {saveSuccess && !isSaving && (
               <div className="alert alert-success mt-20 mb-0" role="status">
                  Profile updated successfully.
               </div>
            )}

            <div className="button-group d-inline-flex align-items-center mt-30">
               <button className="dash-btn-two tran3s me-3" onClick={handleSave} disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save"}
               </button>
            </div>

            {/* Phase 3: kept visually separated (its own card, bottom of
                page) from the ordinary edit/save flow above — see
                DeleteAccountSection.tsx. Same location for both buyers and
                sellers, since this page is shared by both roles. */}
            <DeleteAccountSection />
         </div>
      </div>
   );
};

export default ProfileBody;
