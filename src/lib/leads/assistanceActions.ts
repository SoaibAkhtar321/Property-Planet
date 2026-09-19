"use server";

// src/lib/leads/assistanceActions.ts
//
// Phase 4: the Visitor Assistance server action. Unlike createInquiry/
// createProjectInquiry there is no requireRole()/resolveInquiryBuyer()
// gate — an anonymous visitor can submit this form, exactly like
// createGeneralInquiry(). Unlike createGeneralInquiry, this does not
// insert into `leads` directly: it calls the
// submit_visitor_assistance_request() SQL function
// (0031_visitor_assistance_leads.sql), which is the only write path for
// this lead shape (requester identity from auth.uid(), property slug
// resolved against property_public, rate limiting) — nothing here
// duplicates or second-guesses that logic.

import { createClient } from "@/lib/supabase/server";
import { getAuthContext } from "@/lib/auth/session";
import { normalizeVisitorAssistance, type VisitorAssistanceInput } from "@/lib/leads/assistanceInput";

export interface VisitorAssistanceResult {
   success: boolean;
   error?: string;
   leadId?: string;
}

const PROPERTY_UNAVAILABLE_MESSAGE = "This property is no longer available.";
const RATE_LIMIT_MESSAGE = "Too many requests submitted recently. Please try again later.";
const GENERIC_ERROR_MESSAGE = "Failed to send your request. Please try again.";

/**
 * Submits a visitor-assistance request. Anonymous visitors may submit
 * without an account; a signed-in visitor's request is additionally
 * linked via requester_id (resolved server-side inside the RPC from
 * auth.uid(), never from anything this function passes in).
 */
export async function submitVisitorAssistance(input: VisitorAssistanceInput): Promise<VisitorAssistanceResult> {
   const normalized = normalizeVisitorAssistance(input);
   if (!normalized.ok) {
      return { success: false, error: normalized.error };
   }

   const supabase = await createClient();
   const { value } = normalized;

   const { data, error } = await supabase.rpc("submit_visitor_assistance_request", {
      p_name: value.name,
      p_phone: value.phone,
      p_requirement_type: value.requirementType,
      p_email: value.email,
      p_location: value.location,
      p_budget: value.budget,
      p_details: value.details,
      p_property_slug: value.propertySlug,
   });

   if (error) {
      if (error.message?.includes("This property is no longer available")) {
         return { success: false, error: PROPERTY_UNAVAILABLE_MESSAGE };
      }
      if (error.message?.includes("Too many requests submitted recently")) {
         return { success: false, error: RATE_LIMIT_MESSAGE };
      }
      // Deliberately generic beyond the two known, safe RPC messages above
      // — never pass through a raw Postgres exception to the client.
      return { success: false, error: GENERIC_ERROR_MESSAGE };
   }

   return { success: true, leadId: data as string };
}

export interface VisitorAssistancePrefill {
   name: string;
   phone: string;
   email: string;
}

/**
 * Best-effort prefill for a signed-in visitor: name/phone/email already on
 * their account, so the form can save them re-typing it. The visitor still
 * reviews and submits the form themselves — nothing here auto-submits
 * anything, and this is used to fill only currently-empty fields on the
 * client, never to override what the visitor has already typed.
 */
export async function getVisitorAssistancePrefill(): Promise<VisitorAssistancePrefill | null> {
   const ctx = await getAuthContext();
   if (!ctx) {
      return null;
   }

   const supabase = await createClient();
   const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, phone")
      .eq("id", ctx.userId)
      .maybeSingle();

   return {
      name: profile?.full_name ?? "",
      phone: profile?.phone ?? "",
      email: ctx.email ?? "",
   };
}
