"use client"
import { useState, useEffect } from "react";
import DashboardHeaderTwo from "@/layouts/headers/dashboard/DashboardHeaderTwo";
import Image from "next/image";
import UserAvatarSetting from "./UserAvatarSetting";
import AddressAndLocation from "./AddressAndLocation";
import Link from "next/link";
import SocialMediaLink from "./SocialMediaLink";
import { createClient } from "@/lib/supabase/client";

import avatar_1 from "@/assets/images/dashboard/avatar_02.jpg";

// lastName has no backing column in `profiles` (see 0001_profiles.sql).
// Rather than letting the user type into it and lose the input on reload,
// it's frozen to an empty value with a no-op setter so UserAvatarSetting
// renders unchanged but the field can't hold state that silently vanishes.
const noopSetter = () => { };

const ProfileBody = () => {
   const [name, setName] = useState("");
   const [email, setEmail] = useState("");
   const [firstName, setFirstName] = useState("");
   const [phoneNumber, setPhoneNumber] = useState("");
   const [loadError, setLoadError] = useState("");

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
               .select("full_name, phone")
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
         } catch (error) {
            console.error("Error fetching user data:", error);
            setLoadError("Failed to load your profile. Please try again.");
         }
      };

      fetchProfile();
   }, []);

   const handleSave = async () => {
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
         alert("Profile updated successfully!");
      } catch (error) {
         console.error("Error updating profile:", error);
      }
   };

   return (
      <div className="dashboard-body">
         <div className="position-relative">
            <DashboardHeaderTwo title="Profile" />
            <h2 className="main-title d-block d-lg-none">Profile</h2>
            {loadError && <div className="alert-text mb-20">{loadError}</div>}

            <div className="bg-white card-box border-20">
               <div className="user-avatar-setting d-flex align-items-center mb-30">
                  <Image src={avatar_1} alt="" className="lazy-img user-img" />
                  <div className="upload-btn position-relative tran3s ms-4 me-3">
                     Upload new photo
                     <input type="file" id="uploadImg" name="uploadImg" placeholder="" />
                  </div>
                  <button className="delete-btn tran3s">Delete</button>
               </div>

               <UserAvatarSetting
                  name={name}
                  email={email}
                  firstName={firstName} setFirstName={setFirstName}
                  lastName={""} setLastName={noopSetter}
                  phoneNumber={phoneNumber} setPhoneNumber={setPhoneNumber}
               />
            </div>
            <SocialMediaLink />
            <AddressAndLocation />

            <div className="button-group d-inline-flex align-items-center mt-30">
               <button className="dash-btn-two tran3s me-3" onClick={handleSave}>Save</button>
               <Link href="#" className="dash-cancel-btn tran3s">Cancel</Link>
            </div>
         </div>
      </div>
   );
};

export default ProfileBody;
