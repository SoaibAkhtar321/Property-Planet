"use client"
// src/components/forms/ResetPasswordForm.tsx
//
// Landed on after clicking the link from ForgotPasswordForm's email.
// createBrowserClient() has detectSessionInUrl on by default, so it
// exchanges the recovery code in the URL for a temporary session as soon
// as this page loads -- we just need to call updateUser() with the new
// password while that session is active.

import { useState } from "react";
import { useRouter } from "next/navigation";
import * as yup from "yup";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { toast } from "react-toastify";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

import OpenEye from "@/assets/images/icon/icon_68.svg";

interface FormData {
   password: string;
   confirmPassword: string;
}

const schema = yup
   .object({
      password: yup.string().required("Password is required").min(8, "Password must be at least 8 characters"),
      confirmPassword: yup
         .string()
         .required("Please confirm your password")
         .oneOf([yup.ref("password")], "Passwords must match"),
   })
   .required();

const ResetPasswordForm = () => {
   const router = useRouter();
   const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: yupResolver(schema) });
   const [loading, setLoading] = useState(false);
   // Two independent toggles -- revealing the new password shouldn't
   // force-reveal the confirmation field too, and vice versa.
   const [isPasswordVisible, setPasswordVisibility] = useState(false);
   const [isConfirmVisible, setConfirmVisibility] = useState(false);

   const onSubmit = async (data: FormData) => {
      setLoading(true);
      try {
         const supabase = createClient();
         const { error } = await supabase.auth.updateUser({ password: data.password });
         if (error) {
            toast.error(error.message || "Couldn't update your password. The reset link may have expired.");
            return;
         }
         toast.success("Password updated. Please log in.", { position: "top-center" });
         router.push("/seller/login");
      } catch {
         toast.error("Something went wrong. Please try again.");
      } finally {
         setLoading(false);
      }
   };

   return (
      <form onSubmit={handleSubmit(onSubmit)}>
         <div className="row">
            <div className="col-12">
               <div className="input-group-meta position-relative mb-25">
                  <label>New Password*</label>
                  <input
                     type={isPasswordVisible ? "text" : "password"}
                     {...register("password")}
                     placeholder="Enter new password"
                     className="pass_log_id"
                  />
                  <span className="placeholder_icon">
                     <span className={`passVicon ${isPasswordVisible ? "eye-slash" : ""}`}>
                        <Image
                           onClick={() => setPasswordVisibility((v) => !v)}
                           onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                 e.preventDefault();
                                 setPasswordVisibility((v) => !v);
                              }
                           }}
                           role="button"
                           tabIndex={0}
                           aria-pressed={isPasswordVisible}
                           src={OpenEye}
                           alt="Show password"
                           style={{ cursor: "pointer" }}
                        />
                     </span>
                  </span>
                  <p className="form_error">{errors.password?.message}</p>
               </div>
            </div>
            <div className="col-12">
               <div className="input-group-meta position-relative mb-25">
                  <label>Confirm Password*</label>
                  <input
                     type={isConfirmVisible ? "text" : "password"}
                     {...register("confirmPassword")}
                     placeholder="Confirm new password"
                     className="pass_log_id"
                  />
                  <span className="placeholder_icon">
                     <span className={`passVicon ${isConfirmVisible ? "eye-slash" : ""}`}>
                        <Image
                           onClick={() => setConfirmVisibility((v) => !v)}
                           onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                 e.preventDefault();
                                 setConfirmVisibility((v) => !v);
                              }
                           }}
                           role="button"
                           tabIndex={0}
                           aria-pressed={isConfirmVisible}
                           src={OpenEye}
                           alt="Show password"
                           style={{ cursor: "pointer" }}
                        />
                     </span>
                  </span>
                  <p className="form_error">{errors.confirmPassword?.message}</p>
               </div>
            </div>
            <div className="col-12">
               <button type="submit" className="btn-two w-100 text-uppercase d-block mt-20" disabled={loading}>
                  {loading ? "Updating..." : "Update password"}
               </button>
            </div>
         </div>
      </form>
   );
};

export default ResetPasswordForm;
