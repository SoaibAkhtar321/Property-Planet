"use client"
import Link from "next/link"
import Image from "next/image";
import { useRouter } from "next/navigation";
import DeleteModal from "@/modals/DeleteModal";
import { createClient } from "@/lib/supabase/client";

import profileIcon_1 from "@/assets/images/dashboard/icon/icon_23.svg";
import profileIcon_2 from "@/assets/images/dashboard/icon/icon_24.svg";
import profileIcon_3 from "@/assets/images/dashboard/icon/icon_25.svg";

const Profile = () => {
   const router = useRouter();

   const handleLogout = async () => {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/");
      router.refresh();
   };

   return (
      <>
         <div className="user-name-data">
            <ul className="dropdown-menu" aria-labelledby="profile-dropdown">
               <li>
                  {/* Phase 4 fix: was href="/profile" (no /dashboard prefix) --
                      that route doesn't exist, so this link 404'd for every
                      buyer/seller who opened this dropdown. */}
                  <Link className="dropdown-item d-flex align-items-center" href="/dashboard/profile"><Image src={profileIcon_1} alt="" className="lazy-img" /><span className="ms-2 ps-1">Profile</span></Link>
               </li>
               <li>
                  {/* Phase 4 fix: same bug as above -- was href="/account-settings". */}
                  <Link className="dropdown-item d-flex align-items-center" href="/dashboard/account-settings"><Image src={profileIcon_2} alt="" className="lazy-img" /><span className="ms-2 ps-1">Account Settings</span></Link>
               </li>
               <li>
                  <button type="button" onClick={handleLogout} className="dropdown-item d-flex align-items-center border-0 bg-transparent w-100 text-start"><span className="ms-2 ps-1">Logout</span></button>
               </li>
               <li>
                  <Link className="dropdown-item d-flex align-items-center" href="#" data-bs-toggle="modal" data-bs-target="#deleteModal"><Image src={profileIcon_3} alt="" className="lazy-img"/><span className="ms-2 ps-1">Delete Account</span></Link>
               </li>
            </ul>
         </div>
         <DeleteModal />
      </>
   )
}

export default Profile
