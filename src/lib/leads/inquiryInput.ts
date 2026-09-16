// src/lib/leads/inquiryInput.ts
//
// Server-side validation and buyer resolution for the universal inquiry
// flow. Kept out of actions.ts (which is "use server") because these are
// plain helpers, not server actions — a "use server" module may only
// export async functions.
//
// Why a separate buyer resolver instead of requireRole(["buyer"]):
// requireRole() *redirects*. That is exactly right for a page or a
// dashboard action, and exactly wrong for a modal submitted over a server
// action from a public page — a redirect there throws the buyer out of the
// property they were enquiring about, which is the specific bug this pass
// was asked to fix. resolveInquiryBuyer() returns a typed failure instead,
// so the dialog can show "please sign in" / "sellers can't enquire"
// in place, without losing the enquiry context.
//
// It is NOT weaker than requireRole(): role is still re-derived from
// `profiles` on the server via getAuthContext(), never read from the
// client, and the database's own RLS ("buyers can create own lead",
// 0004) remains the actual boundary. This helper only changes what the
// application does when the check fails, not what the check is.
//
// The buyer-phone gate is handled rather than redirected too: a first-time
// Google buyer has profiles.phone = null, and the inquiry form asks for a
// phone anyway. So the submitted (validated) phone is written to the
// profile when it is still empty, which completes the profile as a side
// effect of the enquiry instead of bouncing the buyer to
// /auth/complete-profile mid-flow.

import type { SupabaseClient } from "@supabase/supabase-js";
import { getAuthContext } from "@/lib/auth/session";

export const MAX_INQUIRY_MESSAGE_LENGTH = 1000;

/** Digits, spaces, +, -, (, ) — 6 to 20 chars, at least 7 actual digits. */
const PHONE_SHAPE = /^[0-9+\-\s()]{6,20}$/;
const DATE_SHAPE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_SHAPE = /^\d{2}:\d{2}$/;

export interface InquiryContactInput {
   phone?: string | null;
   message?: string | null;
   /** "YYYY-MM-DD" or empty/undefined. NEVER defaulted to today. */
   preferredDate?: string | null;
   /** "HH:MM" (24h) or empty/undefined. NEVER defaulted to now. */
   preferredTime?: string | null;
}

export interface NormalizedInquiryContact {
   contact_phone: string;
   message: string | null;
   preferred_date: string | null;
   preferred_time: string | null;
}

export type InquiryInputResult =
   | { ok: true; value: NormalizedInquiryContact }
   | { ok: false; error: string };

/**
 * Validates the four inquiry fields server-side. The client form validates
 * the same rules for UX, but this is the copy that decides — the client
 * check is never the only protection.
 *
 * Phone is mandatory. Date, time and message are each independently
 * optional and normalize to NULL when absent: "phone only", "phone +
 * message", "phone + date", "phone + time" and every combination in
 * between are all valid submissions, and none of them causes a fabricated
 * date or time to be stored.
 */
export function normalizeInquiryContact(input: InquiryContactInput): InquiryInputResult {
   const phone = (input.phone ?? "").trim();

   if (!phone) {
      return { ok: false, error: "Phone number is required." };
   }
   if (!PHONE_SHAPE.test(phone)) {
      return { ok: false, error: "Please enter a valid phone number." };
   }
   if (phone.replace(/\D/g, "").length < 7) {
      return { ok: false, error: "Please enter a valid phone number." };
   }

   const message = (input.message ?? "").trim();
   if (message.length > MAX_INQUIRY_MESSAGE_LENGTH) {
      return { ok: false, error: `Message must be ${MAX_INQUIRY_MESSAGE_LENGTH} characters or fewer.` };
   }

   const rawDate = (input.preferredDate ?? "").trim();
   let preferredDate: string | null = null;
   if (rawDate) {
      if (!DATE_SHAPE.test(rawDate)) {
         return { ok: false, error: "Please choose a valid date." };
      }
      const parsed = new Date(`${rawDate}T00:00:00Z`);
      if (Number.isNaN(parsed.getTime())) {
         return { ok: false, error: "Please choose a valid date." };
      }
      // Reject a date in the past or absurdly far out. A one-day grace on
      // the lower bound covers the buyer being in a timezone ahead of the
      // server rather than rejecting a legitimate "today".
      const now = Date.now();
      if (parsed.getTime() < now - 36 * 60 * 60 * 1000) {
         return { ok: false, error: "Please choose a date that isn't in the past." };
      }
      if (parsed.getTime() > now + 365 * 24 * 60 * 60 * 1000) {
         return { ok: false, error: "Please choose a date within the next year." };
      }
      preferredDate = rawDate;
   }

   const rawTime = (input.preferredTime ?? "").trim();
   let preferredTime: string | null = null;
   if (rawTime) {
      if (!TIME_SHAPE.test(rawTime)) {
         return { ok: false, error: "Please choose a valid time." };
      }
      const [hh, mm] = rawTime.split(":").map(Number);
      if (hh > 23 || mm > 59) {
         return { ok: false, error: "Please choose a valid time." };
      }
      preferredTime = rawTime;
   }

   return {
      ok: true,
      value: {
         contact_phone: phone,
         message: message ? message : null,
         preferred_date: preferredDate,
         preferred_time: preferredTime,
      },
   };
}

export type InquiryBuyerResult =
   | { ok: true; userId: string }
   | { ok: false; error: string; needsAuth?: boolean };

/**
 * Resolves the authenticated buyer for an inquiry without redirecting.
 * Role comes from `profiles` via getAuthContext() — never from the client.
 */
export async function resolveInquiryBuyer(): Promise<InquiryBuyerResult> {
   const ctx = await getAuthContext();

   if (!ctx) {
      return { ok: false, needsAuth: true, error: "Please sign in to send an inquiry." };
   }

   if (ctx.role !== "buyer") {
      return {
         ok: false,
         error: "Inquiries can only be sent from a buyer account. You're signed in as a " + ctx.role + ".",
      };
   }

   return { ok: true, userId: ctx.userId };
}

/**
 * Fills profiles.phone from the enquiry's phone when the profile has none
 * yet (the first-Google-sign-in case). Best-effort: a failure here must
 * never fail the enquiry, which is the thing the buyer actually asked for.
 *
 * Writes through the caller's RLS-respecting client, so this can only ever
 * touch the caller's own profile row ("users can update own profile",
 * 0001) — and only the `phone` column.
 */
export async function backfillProfilePhone(
   supabase: SupabaseClient,
   userId: string,
   phone: string,
): Promise<void> {
   try {
      const { data: profile } = await supabase
         .from("profiles")
         .select("phone")
         .eq("id", userId)
         .maybeSingle();

      if (profile && !profile.phone) {
         await supabase.from("profiles").update({ phone }).eq("id", userId);
      }
   } catch {
      // Intentionally swallowed — see doc comment.
   }
}
