"use client"
// src/components/dashboard/profile/DeleteAccountSection.tsx
//
// Phase 3: Delete Account, rendered at the bottom of /dashboard/profile —
// the one profile/settings page shared by buyers and sellers (see
// AuthNav.tsx: both roles' account menu links here as "Profile"). Kept
// visually separated from the rest of the page (its own red-bordered
// card, below everything else) precisely because it should not read like
// an ordinary "Save" action.
//
// Buyer auth is Google OAuth only (see src/modals/LoginModal.tsx) — this
// app has no password to re-check. The confirmation step instead requires
// typing DELETE, which (like a password prompt would) makes accidental
// activation practically impossible without adding a re-authentication
// flow the app has no way to support.
//
// The actual deletion runs through the server action in
// src/lib/account/actions.ts — nothing here ever touches
// SUPABASE_SERVICE_ROLE_KEY or calls the Supabase Auth admin API
// directly; this component only ever calls the RLS-respecting browser
// client (for the final sign-out) plus the imported server action.

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { deleteOwnAccount } from "@/lib/account/actions"

type Status = "idle" | "confirming" | "deleting" | "error";

const CONFIRM_PHRASE = "DELETE";

const DeleteAccountSection = () => {
   const router = useRouter();
   const [status, setStatus] = useState<Status>("idle");
   const [confirmText, setConfirmText] = useState("");
   const [error, setError] = useState("");

   const openConfirm = () => {
      setConfirmText("");
      setError("");
      setStatus("confirming");
   };

   const closeConfirm = () => {
      if (status === "deleting") return; // don't allow closing mid-request
      setStatus("idle");
      setConfirmText("");
      setError("");
   };

   const handleConfirmDelete = async () => {
      if (confirmText.trim().toUpperCase() !== CONFIRM_PHRASE) {
         setError(`Please type ${CONFIRM_PHRASE} to confirm.`);
         return;
      }

      setStatus("deleting");
      setError("");

      try {
         const result = await deleteOwnAccount();

         if (!result.success) {
            setError(result.error ?? "Something went wrong. Please try again.");
            setStatus("error");
            return;
         }

         // Best-effort client-side cleanup so no stale profile data or
         // session token lingers in the browser, even though the account
         // is already gone server-side at this point.
         try {
            const supabase = createClient();
            await supabase.auth.signOut();
         } catch {
            // Non-fatal — the server-side deletion already succeeded and
            // the auth account no longer exists either way.
         }

         router.push("/");
         router.refresh();
      } catch (err) {
         console.error("Account deletion request failed:", err);
         setError("Something went wrong. Please try again, or contact support if this continues.");
         setStatus("error");
      }
   };

   const isOpen = status === "confirming" || status === "deleting" || status === "error";
   const isDeleting = status === "deleting";

   return (
      <div className="bg-white card-box border-20 mt-30" style={{ border: "1px solid light-dark(#f3c6c6, rgba(224, 92, 92, 0.4))" }}>
         <h4 className="dash-title-three" style={{ color: "light-dark(#c0392b, #ff6b6b)" }}>Delete Account</h4>
         <p className="mb-20">
            Permanently delete your Property Planet account. This cannot be undone from the app.
            Deleting your account may affect your profile information, saved/favourite properties,
            enquiries or other personal activity, and — if you&apos;re a seller — your listings and
            seller account information. Some records may be retained in a limited, non-personal
            form where we have a legitimate operational, security, or legal reason to keep them —
            we don&apos;t claim every historical record is physically destroyed the instant you
            delete your account.
         </p>
         <button
            type="button"
            className="delete-btn tran3s"
            onClick={openConfirm}
            style={{ cursor: "pointer" }}
         >
            Delete Account
         </button>

         {isOpen && (
            <div
               className="modal fade show d-block"
               role="dialog"
               aria-modal="true"
               aria-labelledby="deleteAccountModalTitle"
               style={{ background: "rgba(0,0,0,0.5)" }}
            >
               <div className="modal-dialog modal-dialog-centered">
                  <div className="modal-content p-20">
                     <div className="modal-header border-0">
                        <h5 className="modal-title" id="deleteAccountModalTitle" style={{ color: "light-dark(#c0392b, #ff6b6b)" }}>
                           Permanently delete your account?
                        </h5>
                        {!isDeleting && (
                           <button
                              type="button"
                              className="btn-close"
                              aria-label="Cancel"
                              onClick={closeConfirm}
                           ></button>
                        )}
                     </div>
                     <div className="modal-body">
                        <p className="mb-15">This will:</p>
                        <ul className="mb-20">
                           <li>Remove your profile information</li>
                           <li>Remove your saved/favourite properties</li>
                           <li>Remove personal contact details from your past enquiries</li>
                           <li>Archive and unpublish any properties you&apos;ve listed as a seller</li>
                           <li>Sign you out and prevent you from logging back into this account</li>
                        </ul>
                        <p className="mb-15">
                           Some non-personal business records (such as that an enquiry occurred on a
                           listing) may be retained for legitimate operational, security, or legal
                           reasons, with your personal details removed from them.
                        </p>
                        <div className="dash-input-wrapper mb-10">
                           <label htmlFor="deleteAccountConfirmInput">
                              Type <strong>{CONFIRM_PHRASE}</strong> to confirm
                           </label>
                           <input
                              type="text"
                              id="deleteAccountConfirmInput"
                              value={confirmText}
                              disabled={isDeleting}
                              onChange={(e) => setConfirmText(e.target.value)}
                              autoComplete="off"
                           />
                        </div>
                        {error && <div className="alert-text mb-10">{error}</div>}
                     </div>
                     <div className="modal-footer border-0">
                        <button
                           type="button"
                           className="dash-cancel-btn tran3s"
                           onClick={closeConfirm}
                           disabled={isDeleting}
                        >
                           Cancel
                        </button>
                        <button
                           type="button"
                           className="delete-btn tran3s"
                           onClick={handleConfirmDelete}
                           disabled={isDeleting || confirmText.trim().toUpperCase() !== CONFIRM_PHRASE}
                        >
                           {isDeleting ? "Deleting..." : "Yes, permanently delete my account"}
                        </button>
                     </div>
                  </div>
               </div>
            </div>
         )}
      </div>
   );
};

export default DeleteAccountSection
