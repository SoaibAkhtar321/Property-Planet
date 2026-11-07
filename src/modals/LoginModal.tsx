"use client"
// src/modals/LoginModal.tsx
//
// Buyer auth only. A buyer never sees email/password -- registering and
// logging in are the same action: "Continue with Google". Supabase creates
// the auth.users row (and, via handle_new_user(), the profiles row with
// role 'buyer') automatically the first time someone uses it, so there is
// no separate buyer "register" step to build.
//
// Sellers/agents are a deliberately separate, deliberately different flow
// (email/password + email confirmation) at /seller/register and
// /seller/login -- see those routes -- because unlike a buyer, a seller
// account needs a verifiable email before anyone should trust them to
// receive buyer leads or list a property.

import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"

import googleIcon from "@/assets/images/icon/google.png"

// Several existing callers (ListingDetailsFourArea, CommonReviewForm, etc.)
// still pass loginModal/setLoginModal from before this component managed
// its own state. Accepted-but-unused here, same as the old file, so those
// call sites don't need to change.
const LoginModal = (_props: any) => {
   const [isLoading, setIsLoading] = useState(false);
   const [agreed, setAgreed] = useState(false);
   const [showAgreementError, setShowAgreementError] = useState(false);
   // Step 1 asks who is signing in; buyers then see Google sign-in.
   const [step, setStep] = useState<"choose" | "buyer">("choose");

   const handleGoogleContinue = async () => {
      if (!agreed) {
         setShowAgreementError(true);
         return;
      }
      setIsLoading(true);
      const supabase = createClient();
      await supabase.auth.signInWithOAuth({
         provider: "google",
         options: {
            redirectTo: `${window.location.origin}/auth/callback`,
         },
      });
      // No need to reset isLoading -- a successful call navigates the
      // whole page away to Google immediately.
   };

   return (
      <>
         <div className="modal fade" id="loginModal" tabIndex={-1} aria-hidden="true">
            <div className="modal-dialog modal-fullscreen modal-dialog-centered">
               <div className="container">
                  <div className="user-data-form modal-content">
                     <div className="pp-login-top">
                        {step === "buyer" ? (
                           <button type="button" className="pp-login-back" onClick={() => setStep("choose")}>
                              <i className="bi bi-arrow-left" aria-hidden="true"></i> Back
                           </button>
                        ) : <span />}
                        <button type="button" className="pp-login-close" data-bs-dismiss="modal" aria-label="Close">
                           <i className="bi bi-x-lg" aria-hidden="true"></i> Close
                        </button>
                     </div>
                     <div className="form-wrapper m-auto">
                        {step === "choose" ? (
                           <>
                              <div className="text-center mb-30">
                                 <h2>Welcome to Property Planet</h2>
                                 <p className="fs-18 color-dark">How would you like to sign in?</p>
                              </div>
                              <div className="pp-login-roles">
                                 <button type="button" className="pp-login-role" onClick={() => setStep("buyer")}>
                                    <span className="pp-login-role__icon"><i className="bi bi-house-heart" aria-hidden="true"></i></span>
                                    <span className="pp-login-role__text">
                                       <strong>Buyer login</strong>
                                       <span>Save properties, send enquiries and book site visits</span>
                                    </span>
                                    <i className="bi bi-chevron-right" aria-hidden="true"></i>
                                 </button>
                                 <Link href="/seller/login" className="pp-login-role" data-bs-dismiss="modal">
                                    <span className="pp-login-role__icon pp-login-role__icon--seller"><i className="bi bi-shop" aria-hidden="true"></i></span>
                                    <span className="pp-login-role__text">
                                       <strong>Seller / agent login</strong>
                                       <span>List properties and manage your buyer leads</span>
                                    </span>
                                    <i className="bi bi-chevron-right" aria-hidden="true"></i>
                                 </Link>
                              </div>
                              <p className="text-center fs-15 mt-25 mb-0 color-dark">
                                 New seller? <Link href="/seller/register" data-bs-dismiss="modal">Create a seller account</Link>
                              </p>
                           </>
                        ) : (
                           <>
                              <div className="text-center mb-30">
                                 <h2>Buyer login</h2>
                                 <p className="fs-18 color-dark">Continue with Google — new buyers get an account automatically.</p>
                              </div>

                              <div className="agreement-checkbox d-flex justify-content-between align-items-center mt-20">
                                 <div>
                                    <input
                                       type="checkbox"
                                       id="buyerTermsAccepted"
                                       checked={agreed}
                                       onChange={(e) => {
                                          setAgreed(e.target.checked);
                                          if (e.target.checked) setShowAgreementError(false);
                                       }}
                                    />
                                    <label htmlFor="buyerTermsAccepted">
                                       I agree to the{" "}
                                       <Link href="/terms-of-service" target="_blank">Terms &amp; Conditions</Link> and{" "}
                                       <Link href="/privacy-policy" target="_blank">Privacy Policy</Link>
                                    </label>
                                    {showAgreementError && (
                                       <p className="form_error">Please accept the Terms & Conditions and Privacy Policy to continue.</p>
                                    )}
                                 </div>
                              </div>

                              <button
                                 type="button"
                                 onClick={handleGoogleContinue}
                                 disabled={isLoading}
                                 className="social-use-btn d-flex align-items-center justify-content-center tran3s w-100 mt-10"
                              >
                                 <Image src={googleIcon} alt="" />
                                 <span className="ps-3">{isLoading ? "Redirecting..." : "Continue with Google"}</span>
                              </button>

                              <p className="text-center fs-15 mt-25 mb-0 color-dark">
                                 Selling instead? <Link href="/seller/login" data-bs-dismiss="modal">Seller login</Link>
                              </p>
                           </>
                        )}
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </>
   )
}

export default LoginModal
