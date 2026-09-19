"use client"
// src/components/forms/SellerLoginForm.tsx
//
// Seller/agent login (email/password). Buyers never see this -- they use
// LoginModal's "Continue with Google" instead.
//
// Fixes the old LoginForm.tsx's rawest problem: Supabase's own
// "Email not confirmed" string used to surface directly as the error
// toast, with no way to act on it. This version recognizes that specific
// case and offers a resend button instead of just repeating Supabase's
// wording at the user.

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from 'react-toastify';
import * as yup from "yup";
import { useForm } from "react-hook-form";
import { yupResolver } from '@hookform/resolvers/yup';
import Image from "next/image";

import OpenEye from "@/assets/images/icon/icon_68.svg";
import { createClient } from "@/lib/supabase/client";

interface FormData {
   email: string;
   password: string;
}

const schema = yup
   .object({
      email: yup.string().required().email().label("Email"),
      password: yup.string().required().label("Password"),
   })
   .required();

const SellerLoginForm = () => {
   const router = useRouter();
   const { register, handleSubmit, formState: { errors }, getValues } = useForm<FormData>({ resolver: yupResolver(schema) });
   const [isPasswordVisible, setPasswordVisibility] = useState(false);
   const [needsConfirmation, setNeedsConfirmation] = useState(false);
   const [resending, setResending] = useState(false);
   const togglePasswordVisibility = () => setPasswordVisibility(!isPasswordVisible);

   const onSubmit = async (data: FormData) => {
      setNeedsConfirmation(false);
      try {
         const supabase = createClient();
         const { error } = await supabase.auth.signInWithPassword({
            email: data.email,
            password: data.password,
         });

         if (error) {
            if (error.message.toLowerCase().includes("email not confirmed")) {
               setNeedsConfirmation(true);
            } else {
               toast.error(error.message || "Invalid email or password");
            }
            return;
         }

         toast.success("Login successful", { position: "top-center" });

         const { data: userData } = await supabase.auth.getUser();
         let destination = "/dashboard/dashboard-index";

         if (userData?.user) {
            const { data: profile } = await supabase
               .from("profiles")
               .select("role")
               .eq("id", userData.user.id)
               .maybeSingle();

            // Only ever route to /admin when the trusted profiles row says
            // so. Any missing/unreadable profile falls back to the
            // buyer/seller dashboard -- never an elevated destination.
            if (profile?.role === "admin") {
               destination = "/admin";
            }
         }

         router.push(destination);
      } catch {
         toast.error("An error occurred. Please try again.");
      }
   };

   const handleResend = async () => {
      const email = getValues("email");
      if (!email) {
         toast.error("Enter your email above first.");
         return;
      }
      setResending(true);
      try {
         const supabase = createClient();
         const { error } = await supabase.auth.resend({ type: "signup", email });
         if (error) {
            toast.error(error.message || "Couldn't resend the email");
         } else {
            toast.success("Confirmation email sent again.", { position: "top-center" });
         }
      } finally {
         setResending(false);
      }
   };

   return (
      <form onSubmit={handleSubmit(onSubmit)}>
         <div className="row">
            <div className="col-12">
               <div className="input-group-meta position-relative mb-25">
                  <label>Email*</label>
                  <input type="email" {...register("email")} placeholder="Youremail@gmail.com" />
                  <p className="form_error">{errors.email?.message}</p>
               </div>
            </div>
            <div className="col-12">
               <div className="input-group-meta position-relative mb-20">
                  <label>Password*</label>
                  <input type={isPasswordVisible ? "text" : "password"} {...register("password")} placeholder="Enter Password" className="pass_log_id" />
                  <span className="placeholder_icon">
                     <span className={`passVicon ${isPasswordVisible ? "eye-slash" : ""}`}>
                        <Image
                           onClick={togglePasswordVisibility}
                           onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                 e.preventDefault();
                                 togglePasswordVisibility();
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

            {needsConfirmation && (
               <div className="col-12 mb-20">
                  <p className="fs-16" style={{ color: "#b45309" }}>
                     Your email isn&apos;t confirmed yet. Check your inbox for the confirmation link, or
                  </p>
                  <button type="button" onClick={handleResend} disabled={resending} className="btn-two w-100 text-uppercase d-block mt-10">
                     {resending ? "Sending..." : "Resend confirmation email"}
                  </button>
               </div>
            )}

            <div className="col-12">
               <div className="agreement-checkbox d-flex justify-content-between align-items-center">
                  <div />
                  <Link href="/auth/forgot-password">Forgot Password?</Link>
               </div>
            </div>
            <div className="col-12">
               <button type="submit" className="btn-two w-100 text-uppercase d-block mt-20">Login</button>
            </div>
            <div className="col-12 text-center mt-20">
               <p className="fs-16 color-dark">New seller/agent? <Link href="/seller/register">Register here</Link></p>
            </div>
         </div>
      </form>
   )
}

export default SellerLoginForm;
