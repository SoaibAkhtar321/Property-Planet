"use client";
// src/components/forms/SellerRegisterForm.tsx
//
// Seller/agent self-registration. Deliberately separate from the buyer
// flow (LoginModal's "Continue with Google") -- a seller account is
// trusted with buyer contact info and the ability to list property, so it
// requires a verifiable email/password account rather than a one-click
// social login.
//
// Fixes the two real bugs the old RegisterForm.tsx had:
//   1. It told the user "redirecting to login" but then pushed them to
//      /dashboard/dashboard-index -- with email confirmation required,
//      signUp() creates no session, so that redirect just silently bounced
//      off the dashboard's auth gate back to "/". This version shows an
//      actual "check your email" screen and navigates nowhere.
//   2. Role was always hardcoded to 'buyer' by the DB trigger regardless
//      of who was signing up. This form passes role: 'seller' in the
//      signup metadata; migration 0011's handle_new_user() is the only
//      place that's allowed to act on it, and only ever honors 'buyer' or
//      'seller' from it -- never 'admin'.

import { useState } from "react";
import Link from "next/link";
import { toast } from "react-toastify";
import * as yup from "yup";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import Image from "next/image";

import OpenEye from "@/assets/images/icon/icon_68.svg";
import { createClient } from "@/lib/supabase/client";

interface FormData {
  name: string;
  email: string;
  phone: string;
  password: string;
  termsAccepted: boolean;
}

// Basic sanity check only -- accepts optional +country code and 7-15
// digits, no SMS/OTP verification (explicitly out of scope for this
// change; see the migration this form pairs with).
const PHONE_PATTERN = /^\+?[0-9]{7,15}$/;

const schema = yup
  .object({
    name: yup.string().required("Name is required"),
    email: yup.string().required("Email is required").email("Invalid email"),
    phone: yup
      .string()
      .required("Phone number is required")
      .matches(PHONE_PATTERN, "Enter a valid phone number"),
    password: yup.string().required("Password is required").min(8, "Password must be at least 8 characters"),
    termsAccepted: yup
      .boolean()
      .oneOf([true], "You must accept the terms and conditions")
      .required(),
  })
  .required();

const SellerRegisterForm = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: yupResolver(schema) });

  const [isPasswordVisible, setPasswordVisibility] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const [resending, setResending] = useState(false);

  const togglePasswordVisibility = () => setPasswordVisibility(!isPasswordVisible);

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data: signUpData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.name,
            phone: data.phone,
            role: "seller",
          },
        },
      });

      if (error) {
        toast.error(error.message || "Error during registration", { position: "top-center" });
        return;
      }

      // A signUp() that returns an identities array of length 0 means an
      // account with this email already exists (Supabase's documented way
      // of avoiding an email-enumeration leak) -- tell the user plainly
      // instead of pretending it worked.
      if (signUpData.user && signUpData.user.identities && signUpData.user.identities.length === 0) {
        toast.error("An account with this email already exists. Try logging in instead.", { position: "top-center" });
        return;
      }

      setSubmittedEmail(data.email);
    } catch {
      toast.error("Error during registration", { position: "top-center" });
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!submittedEmail) return;
    setResending(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resend({ type: "signup", email: submittedEmail });
      if (error) {
        toast.error(error.message || "Couldn't resend the email", { position: "top-center" });
      } else {
        toast.success("Confirmation email sent again.", { position: "top-center" });
      }
    } finally {
      setResending(false);
    }
  };

  if (submittedEmail) {
    return (
      <div className="text-center">
        <h4>Check your email</h4>
        <p className="fs-16 color-dark mt-15">
          We&apos;ve sent a confirmation link to <strong>{submittedEmail}</strong>. Click it to activate your
          seller account, then come back and log in.
        </p>
        <button
          type="button"
          onClick={handleResend}
          disabled={resending}
          className="btn-two w-100 text-uppercase d-block mt-20"
        >
          {resending ? "Sending..." : "Resend confirmation email"}
        </button>
        <p className="fs-16 color-dark mt-20">
          Already confirmed? <Link href="/seller/login">Log in</Link>
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="row">
        <div className="col-12">
          <div className="input-group-meta position-relative mb-25">
            <label>Name*</label>
            <input type="text" {...register("name")} placeholder="Your Name" />
            <p className="form_error">{errors.name?.message}</p>
          </div>
        </div>
        <div className="col-12">
          <div className="input-group-meta position-relative mb-25">
            <label>Email*</label>
            <input type="email" {...register("email")} placeholder="Youremail@gmail.com" />
            <p className="form_error">{errors.email?.message}</p>
          </div>
        </div>
        <div className="col-12">
          <div className="input-group-meta position-relative mb-25">
            <label>Phone*</label>
            <input type="tel" {...register("phone")} placeholder="+91 98765 43210" />
            <p className="form_error">{errors.phone?.message}</p>
          </div>
        </div>
        <div className="col-12">
          <div className="input-group-meta position-relative mb-20">
            <label>Password*</label>
            <input
              type={isPasswordVisible ? "text" : "password"}
              {...register("password")}
              placeholder="Enter Password"
              className="pass_log_id"
            />
            <span className="placeholder_icon">
              <span className={`passVicon ${isPasswordVisible ? "eye-slash" : ""}`}>
                <Image onClick={togglePasswordVisibility} src={OpenEye} alt="" />
              </span>
            </span>
            <p className="form_error">{errors.password?.message}</p>
          </div>
        </div>
        <div className="col-12">
          <div className="agreement-checkbox d-flex justify-content-between align-items-center">
            <div>
              <input type="checkbox" id="termsAccepted" {...register("termsAccepted")} />
              <label htmlFor="termsAccepted">
                By hitting the &quot;Register&quot; button, you agree to our{" "}
                <Link href="/terms-of-service" target="_blank">Terms &amp; Conditions</Link> and{" "}
                <Link href="/privacy-policy" target="_blank">Privacy Policy</Link>
              </label>
              <p className="form_error">{errors.termsAccepted?.message}</p>
            </div>
          </div>
        </div>
        <div className="col-12">
          <button type="submit" className="btn-two w-100 text-uppercase d-block mt-20" disabled={loading}>
            {loading ? "Signing up..." : "Register as Seller/Agent"}
          </button>
        </div>
        <div className="col-12 text-center mt-20">
          <p className="fs-16 color-dark">Already have a seller account? <Link href="/seller/login">Log in</Link></p>
        </div>
      </div>
    </form>
  );
};

export default SellerRegisterForm;
