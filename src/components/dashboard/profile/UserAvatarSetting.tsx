"use client"
import { Dispatch, SetStateAction } from "react";

interface UserAvatarSettingProps {
   firstName: string;
   setFirstName: Dispatch<SetStateAction<string>>;
   lastName: string;
   setLastName: Dispatch<SetStateAction<string>>;
   phoneNumber: string;
   setPhoneNumber: Dispatch<SetStateAction<string>>;
   name: string;
   email: string;
}

const UserAvatarSetting: React.FC<UserAvatarSettingProps> = ({
   firstName, setFirstName,
   lastName, setLastName,
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
               <label htmlFor="">First Name*</label>
               <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </div>
         </div>
         <div className="col-sm-6">
            <div className="dash-input-wrapper mb-30">
               <label htmlFor="">Last Name*</label>
               <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} />
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
