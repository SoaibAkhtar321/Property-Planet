"use server";

// src/lib/account/actions.ts
//
// Phase 3: self-service account deletion, backing the Delete Account
// section on /dashboard/profile (see
// src/components/dashboard/profile/DeleteAccountSection.tsx).
//
// Identity is ALWAYS derived server-side from the caller's own session
// via getAuthContext() (src/lib/auth/session.ts) — this action takes no
// user id from the client at all, so there is nothing for a client to
// spoof into deleting someone else's account. Mirrors the identity
// discipline already used everywhere else in this codebase (owner_id in
// src/lib/properties/actions.ts, actor_id in the admin audit log, etc).
//
// Two-step delete, matching the split supabase/migrations/0030 documents:
//   1. request_own_account_deletion() (RPC, RLS-respecting client) —
//      scrubs/anonymizes personal data this account is responsible for
//      and archives any properties it owns.
//   2. auth.admin.deleteUser() (service-role client, server-only) —
//      removes the Supabase Auth identity itself. Only ever called with
//      ctx.userId (the caller's own, server-derived id), and only after
//      step 1 has already succeeded.
//
// SUPABASE_SERVICE_ROLE_KEY is only ever touched here via
// createServiceClient() (src/lib/supabase/server.ts), which is server-only
// and never imported from a "use client" file — never exposed to the
// browser, never a NEXT_PUBLIC_* variable.

import { getAuthContext } from "@/lib/auth/session";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export interface DeleteAccountResult {
   success: boolean;
   error?: string;
}

export async function deleteOwnAccount(): Promise<DeleteAccountResult> {
   const ctx = await getAuthContext();

   if (!ctx) {
      return { success: false, error: "You need to be signed in to delete your account." };
   }

   // Admin accounts are deliberately out of scope for this self-service
   // flow (see Phase 3 brief §14/§19) — this is a normal user-facing
   // feature, not an account-management tool. request_own_account_deletion()
   // also refuses this server-side as defense-in-depth, so this check is
   // belt-and-suspenders, not the only gate.
   if (ctx.role === "admin") {
      return {
         success: false,
         error: "Admin accounts can't be deleted from this page. Contact another admin.",
      };
   }

   const supabase = await createClient();

   // Step 1: scrub/anonymize related personal data + archive listings.
   // Authorized entirely by the caller's own session — the RPC takes no
   // parameters, so there is nothing here for a client to redirect at
   // another account.
   const { error: cleanupError } = await supabase.rpc("request_own_account_deletion");

   if (cleanupError) {
      console.error("Account deletion cleanup failed:", cleanupError.message);
      return {
         success: false,
         error: "We couldn't process your deletion request. Please try again, or contact support if this continues.",
      };
   }

   // Step 2: remove the Supabase Auth identity itself. Only reachable
   // after step 1 succeeded, and only ever for ctx.userId.
   let service;
   try {
      service = createServiceClient();
   } catch (err) {
      console.error("Service client unavailable for account deletion:", err);
      return {
         success: false,
         error:
            "Your data was removed, but we couldn't finish closing your login. Please contact support so we can complete this.",
      };
   }

   const { error: authDeleteError } = await service.auth.admin.deleteUser(ctx.userId);

   if (authDeleteError) {
      console.error("Auth user deletion failed:", authDeleteError.message);
      // Partial failure: personal data is already scrubbed, but the
      // account can still technically authenticate. Do not claim
      // success — surface this clearly so the person knows to follow up,
      // rather than silently leaving a stale, unusable-looking account.
      return {
         success: false,
         error:
            "Your data was removed, but we couldn't finish closing your login. Please contact support so we can complete this.",
      };
   }

   // Best-effort server-side session cleanup. The client also signs out
   // and clears its own state right after calling this action (see
   // DeleteAccountSection.tsx) — this is defense-in-depth, not the only
   // place that happens, and its outcome doesn't change the result
   // reported to the user: the account is already gone at this point.
   try {
      await supabase.auth.signOut();
   } catch (err) {
      console.error("Post-deletion sign-out failed (non-fatal):", err);
   }

   return { success: true };
}
