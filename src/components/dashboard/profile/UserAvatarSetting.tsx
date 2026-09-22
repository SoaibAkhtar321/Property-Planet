"use client"
import { Dispatch, SetStateAction } from "react";

interface UserAvatarSettingProps {
   firstName: string;
   setFirstName: Dispatch<SetStateAction<string>>;
   phoneNumber: string;
   setPhoneNumber: Dispatch<SetStateAction<string>>;
   name: string;
   email: string;
}

// Phase 4I: dropped the "Last Name" field. `profiles` only has one
// `full_name` column (0001_profiles.sql) -- there's never been anywhere
// for a last name to be saved, so the field used to be wired to a no-op
// setter that silently swallowed every keystroke. Relabeled the
// remaining name field "Full Name" to match what it actually saves to,
// instead of "First Name".
const UserAvatarSetting: React.FC<UserAvatarSettingProps> = ({
   firstName, setFirstName,
   phoneNumber, setPhoneNumber,
   name, email
}) => {

   return (
      <div className="row">
         <div className="col-12">
            <div className="dash-input-wrapper mb-30">
               <label htmlFor="">Username*</label>
               <input type="text" value={name} disabled />
            </div>
         </div>
         <div className="col-sm-6">
            <div className="dash-input-wrapper mb-30">
               <label htmlFor="">Full Name*</label>
               <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </div>
         </div>
         <div className="col-sm-6">
            <div className="dash-input-wrapper mb-30">
               <label htmlFor="">Email*</label>
               <input type="email" value={email} disabled />
            </div>
         </div>
         <div className="col-sm-6">
            <div className="dash-input-wrapper mb-30">
               <label htmlFor="">Phone Number*</label>
               <input type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} />
            </div>
         </div>
      </div>
   )
}

export default UserAvatarSetting;
