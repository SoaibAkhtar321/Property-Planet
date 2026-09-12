"use server";

// src/lib/profile/actions.ts
//
// Buyer profile-completion action for /auth/complete-profile. Writes only
// to the caller's own `profiles.phone`, which the "users can update own
// profile" RLS policy (0001_profiles.sql) already permits -- no RLS change
// needed, no new write path, no admin/service-role client involved.
//
// Deliberately does NOT call requireDashboardUser()/requireRole() here:
// those redirect a buyer with a null phone straight to
// /auth/complete-profile, which is exactly the page this action is
// submitted from -- looping back into that redirect would be a no-op at
// best. Instead this re-derives identity from the session directly and
// re-checks role itself, the same fail-closed shape those helpers use.

import { createClient } from "@/lib/supabase/server";

export interface CompleteProfileResult {
   success: boolean;
   error?: string;
}

// Same basic sanity check as SellerRegisterForm.tsx -- optional +country
// code, 7-15 digits. No SMS/OTP verification (out of scope).
const PHONE_PATTERN = /^\+?[0-9]{7,15}$/;

export async function completeBuyerProfile(phone: string): Promise<CompleteProfileResult> {
   const trimmed = phone?.trim();

   if (!trimmed || !PHONE_PATTERN.test(trimmed)) {
      return { success: false, error: "Enter a valid phone number." };
   }

   const supabase = await createClient();

   const {
      data: { user },
   } = await supabase.auth.getUser();

   if (!user) {
      return { success: false, error: "Your session has expired. Please log in again." };
   }

   const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

   if (profileError || !profile) {
      return { success: false, error: "Could not load your profile. Please try again." };
   }

   // This screen only exists for buyers completing their post-Google-login
   // profile; sellers/admins already have (or set) their phone elsewhere
   // and should never be able to hit this action.
   if (profile.role !== "buyer") {
      return { success: false, error: "This step doesn't apply to your account." };
   }

   const { error: updateError } = await supabase
      .from("profiles")
      .update({ phone: trimmed })
      .eq("id", user.id);

   if (updateError) {
      return { success: false, error: "Failed to save your phone number. Please try again." };
   }

   return { success: true };
}
