// src/lib/leads/assistanceInput.ts
//
// Phase 4: server-side validation for the Visitor Assistance request
// form (src/components/assistance/VisitorAssistance.tsx). Kept out of
// assistanceActions.ts (which is "use server") for the same reason
// inquiryInput.ts is separate from actions.ts — plain helpers, not server
// actions.
//
// Required: name, phone, requirement type. Optional: email, location,
// budget, additional details. This mirrors normalizeInquiryContact /
// normalizeGeneralContact's shape-checks (phone/email regex, length
// limits) rather than inventing new rules.

import { validateContactName, MAX_CONTACT_NAME_LENGTH } from "@/lib/leads/inquiryInput";
import { isVisitorRequirementType, type VisitorRequirementType } from "@/lib/leads/assistanceOptions";
import { normalizeIndianMobileOrNull } from "@/lib/validation/phone";

const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const MAX_ASSISTANCE_LOCATION_LENGTH = 120;
export const MAX_ASSISTANCE_BUDGET_LENGTH = 60;
export const MAX_ASSISTANCE_DETAILS_LENGTH = 1000;

export { MAX_CONTACT_NAME_LENGTH };

export interface VisitorAssistanceInput {
   name?: string | null;
   phone?: string | null;
   requirementType?: string | null;
   email?: string | null;
   location?: string | null;
   budget?: string | null;
   details?: string | null;
   /** Slug of the property being viewed, if any — never an id/title. The
    *  server re-resolves this against published properties; it is never
    *  trusted as-is. */
   propertySlug?: string | null;
}

export interface NormalizedVisitorAssistance {
   name: string;
   phone: string;
   requirementType: VisitorRequirementType;
   email: string | null;
   location: string | null;
   budget: string | null;
   details: string | null;
   propertySlug: string | null;
}

export type VisitorAssistanceInputResult =
   | { ok: true; value: NormalizedVisitorAssistance }
   | { ok: false; error: string };

export function normalizeVisitorAssistance(input: VisitorAssistanceInput): VisitorAssistanceInputResult {
   const nameResult = validateContactName(input.name);
   if (!nameResult.ok) {
      return { ok: false, error: nameResult.error };
   }

   const phone = (input.phone ?? "").trim();
   if (!phone) {
      return { ok: false, error: "Phone number is required." };
   }
   const normalizedPhone = normalizeIndianMobileOrNull(phone);
   if (!normalizedPhone) {
      return { ok: false, error: "Please enter a valid 10-digit Indian mobile number." };
   }

   if (!isVisitorRequirementType(input.requirementType)) {
      return { ok: false, error: "Please choose what you're looking for." };
   }

   let email: string | null = null;
   const rawEmail = (input.email ?? "").trim();
   if (rawEmail) {
      if (!EMAIL_SHAPE.test(rawEmail)) {
         return { ok: false, error: "Please enter a valid email address." };
      }
      email = rawEmail;
   }

   const location = (input.location ?? "").trim();
   if (location.length > MAX_ASSISTANCE_LOCATION_LENGTH) {
      return { ok: false, error: `Location must be ${MAX_ASSISTANCE_LOCATION_LENGTH} characters or fewer.` };
   }

   const budget = (input.budget ?? "").trim();
   if (budget.length > MAX_ASSISTANCE_BUDGET_LENGTH) {
      return { ok: false, error: `Budget must be ${MAX_ASSISTANCE_BUDGET_LENGTH} characters or fewer.` };
   }

   const details = (input.details ?? "").trim();
   if (details.length > MAX_ASSISTANCE_DETAILS_LENGTH) {
      return { ok: false, error: `Details must be ${MAX_ASSISTANCE_DETAILS_LENGTH} characters or fewer.` };
   }

   const propertySlug = (input.propertySlug ?? "").trim();

   return {
      ok: true,
      value: {
         name: nameResult.value,
         phone: normalizedPhone,
         requirementType: input.requirementType,
         email: email ? email : null,
         location: location ? location : null,
         budget: budget ? budget : null,
         details: details ? details : null,
         propertySlug: propertySlug ? propertySlug : null,
      },
   };
}
