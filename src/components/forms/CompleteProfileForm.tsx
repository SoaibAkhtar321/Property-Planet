"use client";
// src/components/forms/CompleteProfileForm.tsx
//
// Buyer profile-completion form for /auth/complete-profile. Submits to
// completeBuyerProfile() (src/lib/profile/actions.ts), which writes only
// the caller's own `profiles.phone` under existing RLS. On success,
// navigates to the buyer's dashboard -- there is no reason to keep this
// screen mounted once phone is set, and revisiting /auth/complete-profile
// afterward now redirects away server-side (see page.tsx).

import { useState } from "react";
import { useRouter } from "next/navigation";
import * as yup from "yup";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { toast } from "react-toastify";

import { completeBuyerProfile } from "@/lib/profile/actions";

interface FormData {
   phone: string;
}

const PHONE_PATTERN = /^\+?[0-9]{7,15}$/;

const schema = yup
   .object({
      phone: yup
         .string()
         .required("Phone number is required")
         .matches(PHONE_PATTERN, "Enter a valid phone number"),
   })
   .required();

const CompleteProfileForm = () => {
   const router = useRouter();
   const {
      register,
      handleSubmit,
      formState: { errors },
   } = useForm<FormData>({ resolver: yupResolver(schema) });
   const [loading, setLoading] = useState(false);

   const onSubmit = async (data: FormData) => {
      setLoading(true);
      try {
         const result = await completeBuyerProfile(data.phone);
         if (!result.success) {
            toast.error(result.error || "Failed to save your phone number.", { position: "top-center" });
            return;
         }
         router.replace("/dashboard/dashboard-index");
         router.refresh();
      } finally {
         setLoading(false);
      }
   };

   return (
      <form onSubmit={handleSubmit(onSubmit)}>
         <div className="row">
            <div className="col-12">
               <div className="input-group-meta position-relative mb-25">
                  <label>Phone*</label>
                  <input type="tel" {...register("phone")} placeholder="+91 98765 43210" />
                  <p className="form_error">{errors.phone?.message}</p>
               </div>
            </div>
            <div className="col-12">
               <button type="submit" className="btn-two w-100 text-uppercase d-block mt-20" disabled={loading}>
                  {loading ? "Saving..." : "Continue"}
               </button>
            </div>
         </div>
      </form>
   );
};

export default CompleteProfileForm;
