"use client"
// src/components/forms/ResetPasswordForm.tsx
//
// Landed on after /auth/callback has already exchanged the recovery code
// from ForgotPasswordForm's email for a session (see that route for why:
// this page used to rely on createBrowserClient's detectSessionInUrl to
// exchange a PKCE `?code=` link itself, which never actually happened,
// hence the "Supabase auth session expired" bug). By the time this
// component mounts, the recovery session should already exist as a
// cookie -- but it still verifies that before showing the form, rather
// than trusting the URL blindly, since:
//   - the link may have been opened a second time (recovery codes are
//     single-use) or after it expired,
//   - a PASSWORD_RECOVERY auth event can also arrive slightly after mount,
//     so a brief "verifying" state avoids a false-negative flash.
// Three states: "verifying" (checking for a session) -> "ready" (session
// confirmed, show the form) or "invalid" (no session -- link expired,
// already used, or this page was opened directly).

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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

type VerifyState = "verifying" | "ready" | "invalid";

const ResetPasswordForm = () => {
   const router = useRouter();
   const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: yupResolver(schema) });
   const [loading, setLoading] = useState(false);
   // Two independent toggles -- revealing the new password shouldn't
   // force-reveal the confirmation field too, and vice versa.
   const [isPasswordVisible, setPasswordVisibility] = useState(false);
   const [isConfirmVisible, setConfirmVisibility] = useState(false);
   const [verifyState, setVerifyState] = useState<VerifyState>("verifying");

   useEffect(() => {
      const supabase = createClient();
      let settled = false;

      const markReady = () => {
         if (!settled) {
            settled = true;
            setVerifyState("ready");
         }
      };

      // Primary check: /auth/callback already exchanged the code, so a
      // session should already be readable from cookies.
      supabase.auth.getUser().then(({ data, error }) => {
         if (!error && data.user) {
            markReady();
         } else if (!settled) {
            setVerifyState("invalid");
         }
      });

      // Defense-in-depth: if this page is ever reached with the recovery
      // code still unexchanged (e.g. an old email link, or a future
      // change to the redirect target), the browser client's own
      // detectSessionInUrl will fire a PASSWORD_RECOVERY event once it
      // finishes -- catch that too rather than only checking once at
      // mount.
      const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
         if (event === "PASSWORD_RECOVERY" && session) {
            markReady();
         }
      });

      return () => {
         listener.subscription.unsubscribe();
      };
   }, []);

   const onSubmit = async (data: FormData) => {
      setLoading(true);
      try {
         const supabase = createClient();
         const { error } = await supabase.auth.updateUser({ password: data.password });
         if (error) {
            // A session that looked valid a moment ago can still be
            // rejected here (revoked, or the recovery token's short TTL
            // ran out between verification and submit) -- fall back to
            // the same "invalid" state rather than leaving a broken form
            // on screen.
            setVerifyState("invalid");
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

   if (verifyState === "verifying") {
      return (
         <div className="text-center reset-verifying" role="status">
            <p className="fs-16 color-dark mb-0">Verifying your reset link…</p>
         </div>
      );
   }

   if (verifyState === "invalid") {
      return (
         <div className="text-center">
            <h4>This link is invalid or has expired</h4>
            <p className="fs-16 color-dark mt-15">
               Password reset links can only be used once and expire after a short time. Please request a new one.
            </p>
            <p className="fs-16 color-dark mt-20">
               <Link href="/auth/forgot-password">Request a new reset link</Link>
            </p>
         </div>
      );
   }

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
