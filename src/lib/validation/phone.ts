// src/lib/validation/phone.ts
//
// Phase 5: single source of truth for "is this a valid Indian mobile
// number", used by both client-side yup schemas (SellerRegisterForm,
// CompleteProfileForm, ContactForm) and every server-side normalizer
// (inquiryInput.ts, assistanceInput.ts, profile/actions.ts) that used to
// each carry their own loose, duplicated `/^\+?[0-9]{7,15}$/`-style regex.
// That old shape accepted plenty of non-Indian-mobile strings (any
// 7-to-15-digit run, any leading digit) and rejected nothing that actually
// mattered -- it checked length, not format. Client-side validation is
// UX only; this file's checks are what the server actually enforces.
//
// Format: exactly 10 digits, first digit 6-9. No OTP/ownership
// verification here -- format only, by design (see Phase 5 spec).

/** Bare 10-digit Indian mobile number, no country code, no punctuation. */
export const INDIAN_MOBILE_LOCAL_REGEX = /^[6-9]\d{9}$/;

/**
 * Strips everything but digits, then drops a leading country-code/trunk
 * prefix if present, so a number typed as "+91 98765 43210", "91 9876543210"
 * or "09876543210" (a leading national trunk 0) all normalize to the same
 * bare 10-digit form before validation. Does NOT itself validate the
 * result -- always follow with isValidIndianMobile() or use
 * normalizeIndianMobileOrNull().
 */
export function normalizeIndianMobile(raw: string | null | undefined): string {
   let digits = (raw ?? "").replace(/\D/g, "");

   if (digits.length === 11 && digits.startsWith("0")) {
      digits = digits.slice(1);
   }
   if (digits.length === 12 && digits.startsWith("91")) {
      digits = digits.slice(2);
   }

   return digits;
}

/** True only for a genuine 10-digit Indian mobile number (6/7/8/9-first), after normalization. */
export function isValidIndianMobile(raw: string | null | undefined): boolean {
   return INDIAN_MOBILE_LOCAL_REGEX.test(normalizeIndianMobile(raw));
}

/**
 * Returns the normalized bare 10-digit number when valid, otherwise null.
 * Server-side normalizers store this (not the raw, punctuation-carrying
 * input) so `profiles.phone` / `leads.contact_phone` stay in one
 * consistent shape regardless of how the number was typed.
 */
export function normalizeIndianMobileOrNull(raw: string | null | undefined): string | null {
   const normalized = normalizeIndianMobile(raw);
   return INDIAN_MOBILE_LOCAL_REGEX.test(normalized) ? normalized : null;
}
