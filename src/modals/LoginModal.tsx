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

   const handleGoogleContinue = async () => {
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
                     <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                     <div className="form-wrapper m-auto">
                        <div className="text-center mb-30">
                           <h2>Welcome to Property Planet</h2>
                           <p className="fs-20 color-dark">Continue with Google to browse and enquire about properties.</p>
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

                        <div className="text-center mt-30">
                           <p className="fs-16 color-dark">
                              Are you a seller or agent?{" "}
                              <Link href="/seller/login" data-bs-dismiss="modal">Login</Link>
                              {" "}or{" "}
                              <Link href="/seller/register" data-bs-dismiss="modal">register here</Link>.
                           </p>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </>
   )
}

export default LoginModal
