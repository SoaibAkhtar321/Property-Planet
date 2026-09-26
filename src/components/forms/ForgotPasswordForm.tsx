"use client"
import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import * as yup from "yup";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { toast } from "react-toastify";
import { createClient } from "@/lib/supabase/client";

interface FormData {
   email: string;
}

const schema = yup.object({ email: yup.string().required().email().label("Email") }).required();

const ForgotPasswordForm = () => {
   const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: yupResolver(schema) });
   const [sent, setSent] = useState(false);
   const [loading, setLoading] = useState(false);
   const searchParams = useSearchParams();
   // Phase 4: /auth/callback sends a stale/expired/invalid recovery link
   // back here (instead of failing silently on the reset-password page)
   // with this query param carrying a human-readable reason.
   const [resetError, setResetError] = useState<string | null>(null);

   useEffect(() => {
      const message = searchParams.get("reset_error");
      if (message) setResetError(message);
   }, [searchParams]);

   const onSubmit = async (data: FormData) => {
      setLoading(true);
      setResetError(null);
      try {
         const supabase = createClient();
         // Supabase always returns success here regardless of whether the
         // email exists, by design (avoids leaking which emails are
         // registered) -- so we always show the same "check your email"
         // state rather than branching on the result.
         await supabase.auth.resetPasswordForEmail(data.email, {
            // Routed through /auth/callback (same code-exchange route the
            // Google OAuth sign-in already uses) rather than straight to
            // /auth/reset-password, so the recovery code in the link is
            // actually exchanged for a session before that page renders.
            redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent("/auth/reset-password")}`,
         });
         setSent(true);
      } catch {
         toast.error("Something went wrong. Please try again.");
      } finally {
         setLoading(false);
      }
   };

   if (sent) {
      return (
         <div className="text-center">
            <h4>Check your email</h4>
            <p className="fs-16 color-dark mt-15">
               If an account exists for that address, we&apos;ve sent a link to reset your password.
            </p>
            <p className="fs-16 color-dark mt-20">
               <Link href="/seller/login">Back to login</Link>
            </p>
         </div>
      );
   }

   return (
      <form onSubmit={handleSubmit(onSubmit)}>
         <div className="row">
            {resetError && (
               <div className="col-12">
                  <div className="reset-link-alert mb-25" role="alert">
                     Your password reset link {resetError.toLowerCase().includes("expired") ? "has expired" : "is invalid or has already been used"}. Please request a new one below.
                  </div>
               </div>
            )}
            <div className="col-12">
               <div className="input-group-meta position-relative mb-25">
                  <label>Email*</label>
                  <input type="email" {...register("email")} placeholder="Youremail@gmail.com" />
                  <p className="form_error">{errors.email?.message}</p>
               </div>
            </div>
            <div className="col-12">
               <button type="submit" className="btn-two w-100 text-uppercase d-block mt-20" disabled={loading}>
                  {loading ? "Sending..." : "Send reset link"}
               </button>
            </div>
            <div className="col-12 text-center mt-20">
               <p className="fs-16 color-dark"><Link href="/seller/login">Back to login</Link></p>
            </div>
         </div>
      </form>
   );
};

export default ForgotPasswordForm;
