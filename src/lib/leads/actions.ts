"use server";

// src/lib/leads/actions.ts
//
// Phase 3: the buyer-inquiry server action. Mirrors src/lib/properties/actions.ts's
// pattern — requireRole() first, write through the RLS-respecting createClient()
// (never a service client), return an ActionResult instead of throwing.
//
// Identity: buyer_id is ALWAYS taken from requireRole(["buyer"]).userId, never
// from client input. The client only ever supplies propertyId + an optional
// message.
//
// Property validation: propertyId is checked against `property_public`, not
// `properties`. property_public's definition (`where status = 'published'`)
// means this single lookup both confirms the property exists AND that it's
// actually published — a draft/pending listing id (which a buyer should never
// be able to see in the first place) cannot be used to create a lead against
// its owner.
//
// Re-inquiry / status protection: `leads` has `unique (buyer_id, property_id)`,
// and — per the 0004 RLS policies — buyers have an INSERT policy on `leads`
// but NO UPDATE policy at all (only sellers on their own property, and admins,
// can update a lead). That means a second createInquiry() call for a property
// the buyer already has a lead on cannot touch that row's status even if this
// function tried to: the database has no update path available to the buyer's
// role. So this action never attempts an upsert/update — it does a plain
// insert and treats a unique-violation (23505) as "you already inquired",
// not an error.
//
// createInquiry also copies the property's project_id (if any) onto the
// lead it creates, so a plot enquiry preserves project context per section
// 27 of the master prompt. That value now comes from the same
// property_public row the published check uses — see createInquiry's own
// doc comment.
//
// createProjectInquiry (added alongside 0013_leads_project_id.sql): a
// project-level counterpart to createInquiry, for a buyer enquiring about a
// project in general rather than a specific plot/listing. Same pattern:
// identity from requireRole(["buyer"]), the id re-validated against
// `project_public` (not `projects`) so a draft/unpublished project can never
// be inquired against, and a unique-violation on the new partial index
// (leads_buyer_project_unique) is treated as "you already inquired", not an
// error. It always inserts property_id: null — it is not used for, and does
// not touch, plot-level leads (createInquiry, above, handles those and now
// separately backfills project_id onto them).

import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import {
   backfillProfilePhone,
   normalizeGeneralContact,
   normalizeInquiryContact,
   resolveInquiryBuyer,
   type GeneralContactInput,
   type InquiryContactInput,
} from "@/lib/leads/inquiryInput";

export interface ActionResult {
   success: boolean;
   error?: string;
   alreadyExists?: boolean;
   /** Set when the failure is "not signed in", so the dialog can offer
    *  Google sign-in while keeping the enquiry context on screen rather
    *  than being redirected away from it. */
   needsAuth?: boolean;
}

export type LeadStatus = "new" | "contacted" | "qualified" | "site_visit" | "negotiation" | "closed" | "lost";

export interface MyLead {
   leadId: string;
   status: LeadStatus;
}

export interface SiteVisitActionResult {
   success: boolean;
   error?: string;
   alreadyExists?: boolean;
}

const UNIQUE_VIOLATION = "23505";
// Message length is validated in inquiryInput.ts (MAX_INQUIRY_MESSAGE_LENGTH).

/**
 * Creates (or, if one already exists, safely no-ops on) a buyer inquiry for
 * a published property. Called from InquiryForm on the property detail page.
 *
 * project_id: if the property belongs to a project (properties.project_id,
 * see 0007_properties_project_id.sql), that project_id is copied onto the
 * lead too — per section 27 of the Property Planet master prompt, a plot
 * enquiry should preserve both project context and exact property context
 * (project_id set AND property_id set), not just the property.
 *
 * Since 0017_project_units.sql, property_public exposes project_id, so the
 * single published-property lookup below resolves both the "is this a real,
 * live listing" check and the project context in one read — there is no
 * longer a second, best-effort query against the `properties` base table
 * that could silently leave project_id NULL on a unit enquiry.
 *
 * That gives the three enquiry shapes the schema is designed around:
 *   Individual Property -> property_id set, project_id NULL
 *   Project Unit        -> property_id set, project_id = the unit's project
 *   Project             -> property_id NULL, project_id set
 *                          (createProjectInquiry, below)
 */
export async function createInquiry(
   propertyId: string,
   contact: InquiryContactInput = {},
): Promise<ActionResult> {
   if (!propertyId || typeof propertyId !== "string") {
      return { success: false, error: "A property is required." };
   }

   // Phase 20: resolveInquiryBuyer() instead of requireRole(["buyer"]).
   // Same server-derived role check, but it RETURNS a failure rather than
   // redirecting — a redirect here would throw the buyer out of the very
   // property they were enquiring about. See inquiryInput.ts.
   const buyer = await resolveInquiryBuyer();
   if (!buyer.ok) {
      return { success: false, error: buyer.error, needsAuth: buyer.needsAuth };
   }

   const normalized = normalizeInquiryContact(contact);
   if (!normalized.ok) {
      return { success: false, error: normalized.error };
   }

   const supabase = await createClient();

   // Re-derive that the property is real AND published — never trust that
   // the id the client posted corresponds to a live, public listing.
   const { data: property, error: propertyError } = await supabase
      .from("property_public")
      .select("id, project_id")
      .eq("id", propertyId)
      .maybeSingle();

   if (propertyError || !property) {
      return { success: false, error: "This property is no longer available." };
   }

   const { error: insertError } = await supabase.from("leads").insert({
      buyer_id: buyer.userId,
      property_id: propertyId,
      // Name and phone are mandatory and validated above; date/time/message
      // are each independently optional and are stored as NULL when absent
      // — never as a fabricated placeholder value.
      contact_name: normalized.value.contact_name,
      contact_phone: normalized.value.contact_phone,
      preferred_date: normalized.value.preferred_date,
      preferred_time: normalized.value.preferred_time,
      // Phase 10: exactly one server-side read decides both halves of the
      // lead. An Individual Property yields project_id NULL; a Project
      // Unit yields its parent project's id. Neither value is ever taken
      // from the client.
      project_id: property.project_id ?? null,
      message: normalized.value.message,
      // status intentionally omitted — column default is 'new'. There is no
      // buyer-facing update path to this row afterward (see file header), so
      // this insert is the only write this function ever performs.
   });

   if (insertError) {
      if (insertError.code === UNIQUE_VIOLATION) {
         // Buyer already has a lead on this property. Buyers have no UPDATE
         // policy on `leads`, so there's nothing to change here even if this
         // were a progressed lead — surface it as a neutral, non-error state.
         return { success: true, alreadyExists: true };
      }
      return { success: false, error: "Failed to send inquiry. Please try again." };
   }

   await backfillProfilePhone(supabase, buyer.userId, normalized.value.contact_phone);

   return { success: true };
}

/**
 * Resolves the authenticated buyer's own lead for a property, if one
 * exists. Used to find the lead_id a site-visit request should attach to,
 * without ever trusting a client-supplied lead_id.
 *
 * The `.eq("buyer_id", ctx.userId)` filter here is defense-in-depth, not
 * the actual boundary — the "buyers can read own leads" RLS policy on
 * `leads` already restricts what this query can see to rows where
 * `auth.uid() = buyer_id`, so this can never resolve another buyer's lead
 * even if the filter were removed.
 */
export async function getMyLeadForProperty(propertyId: string): Promise<MyLead | null> {
   if (!propertyId || typeof propertyId !== "string") {
      return null;
   }

   const ctx = await requireRole(["buyer"]);
   const supabase = await createClient();

   const { data, error } = await supabase
      .from("leads")
      .select("id, status")
      .eq("property_id", propertyId)
      .eq("buyer_id", ctx.userId)
      .maybeSingle();

   if (error || !data) {
      return null;
   }

   return { leadId: data.id, status: data.status as LeadStatus };
}

const MIN_LEAD_TIME_MS = 60 * 60 * 1000; // requested time must be at least 1 hour out
const MAX_SITE_VISIT_NOTES_LENGTH = 1000;

/**
 * Creates a site-visit request on the buyer's own lead.
 *
 * Ownership: the lead is re-fetched and its buyer_id explicitly compared to
 * the authenticated caller before any insert is attempted. This is
 * defense-in-depth on top of the real boundary, which is the "buyers can
 * request a site visit on own lead" RLS policy on `site_visits` — that
 * policy's `with check` re-derives ownership from `leads.buyer_id =
 * auth.uid()` independently of this function, so a forged/guessed lead_id
 * for another buyer's lead is rejected by the database even if this check
 * were skipped.
 *
 * Status: never accepted from the client. The insert omits `status`
 * entirely, letting the column default to 'requested'. Buyers have no
 * UPDATE policy on `site_visits` at all (only sellers on the owning
 * property, and admins, do) — so there is no path, in this function or
 * otherwise, for a buyer to confirm/approve their own visit or otherwise
 * change its status after creation.
 *
 * Duplicate requests: `site_visits` has no unique constraint on lead_id,
 * so nothing in the schema stops repeated requests. The check below for an
 * existing non-terminal ('requested' or 'confirmed') visit on the same
 * lead is a business-rule/spam guard only — it is not an authorization
 * boundary, since RLS already fully contains any cross-user risk.
 */
export async function createSiteVisit(
   leadId: string,
   scheduledAt: string,
   notes?: string
): Promise<SiteVisitActionResult> {
   if (!leadId || typeof leadId !== "string") {
      return { success: false, error: "A lead is required." };
   }

   // Expected to already be an ISO timestamp — InquiryForm converts the
   // browser's unqualified datetime-local value to ISO before calling this
   // action, so the buyer's local time is resolved once, client-side, and
   // never re-interpreted against whatever timezone this server runs in.
   // new Date() on a non-ISO/ambiguous string would be parsed here instead
   // — validating it still parses to a real date is enough of a guard.
   const scheduledDate = scheduledAt ? new Date(scheduledAt) : null;
   if (!scheduledDate || Number.isNaN(scheduledDate.getTime())) {
      return { success: false, error: "Please choose a valid date and time." };
   }
   if (scheduledDate.getTime() < Date.now() + MIN_LEAD_TIME_MS) {
      return { success: false, error: "Please choose a date and time at least an hour from now." };
   }

   const ctx = await requireRole(["buyer"]);
   const supabase = await createClient();

   const { data: lead, error: leadError } = await supabase
      .from("leads")
      .select("id, buyer_id, property_id")
      .eq("id", leadId)
      .maybeSingle();

   if (leadError || !lead || lead.buyer_id !== ctx.userId) {
      return { success: false, error: "This inquiry could not be found." };
   }

   // Site visits are inherently plot-specific — you visit a physical
   // property, not an abstract project. A project-only lead (property_id
   // NULL, see 0013_leads_project_id.sql / createProjectInquiry()) has
   // nothing to visit, so reject it here rather than letting it silently
   // create a visit request with no plot behind it.
   if (!lead.property_id) {
      return { success: false, error: "Site visits require a specific plot." };
   }

   const { data: existingVisits, error: existingError } = await supabase
      .from("site_visits")
      .select("id")
      .eq("lead_id", leadId)
      .in("status", ["requested", "confirmed"])
      .limit(1);

   if (existingError) {
      return { success: false, error: "Failed to check existing site visit requests. Please try again." };
   }
   if (existingVisits && existingVisits.length > 0) {
      return { success: true, alreadyExists: true };
   }

   const trimmedNotes = notes?.trim();
   if (trimmedNotes && trimmedNotes.length > MAX_SITE_VISIT_NOTES_LENGTH) {
      return { success: false, error: `Notes must be ${MAX_SITE_VISIT_NOTES_LENGTH} characters or fewer.` };
   }

   const { error: insertError } = await supabase.from("site_visits").insert({
      lead_id: leadId,
      scheduled_at: scheduledDate.toISOString(),
      notes: trimmedNotes ? trimmedNotes : null,
      // status intentionally omitted — column default is 'requested'. See
      // file header: buyers have no UPDATE policy on site_visits, so this
      // insert is the only write this function ever performs.
   });

   if (insertError) {
      return { success: false, error: "Failed to request a site visit. Please try again." };
   }

   return { success: true };
}

/**
 * Cancels the buyer's own site visit (status requested/confirmed only).
 *
 * Authorization: "own" is re-derived server-side from the visit's parent
 * lead (lead.buyer_id === ctx.userId), exactly like createSiteVisit() —
 * never trusted from client input. The database is the actual backstop
 * regardless (see 0022_site_visit_cancellation.sql's
 * enforce_buyer_site_visit_update trigger + "buyers can update own site
 * visits" RLS policy): even if this check were removed, a buyer's UPDATE
 * could not reach another buyer's visit, a non-cancel status, or any
 * column but status.
 *
 * Per the confirmed cancellation policy: no time cutoff (a visit may be
 * cancelled at any point up to and including shortly before its scheduled
 * time), the parent lead is never touched, and the site_visits row is
 * never deleted — it becomes status='cancelled', preserving history for
 * admin visibility. Seller notification is handled entirely in the
 * database (site_visits_notify_seller_on_cancel trigger), not here, so
 * this function performs a single UPDATE and nothing else.
 */
export async function cancelSiteVisit(siteVisitId: string): Promise<SiteVisitActionResult> {
   if (!siteVisitId || typeof siteVisitId !== "string") {
      return { success: false, error: "A site visit is required." };
   }

   const ctx = await requireRole(["buyer"]);
   const supabase = await createClient();

   const { data: visit, error: visitError } = await supabase
      .from("site_visits")
      .select("id, status, lead_id, leads!inner(buyer_id)")
      .eq("id", siteVisitId)
      .maybeSingle();

   if (visitError || !visit || (visit as unknown as { leads: { buyer_id: string } }).leads.buyer_id !== ctx.userId) {
      return { success: false, error: "This site visit could not be found." };
   }

   if (!["requested", "confirmed"].includes(visit.status)) {
      return { success: false, error: "This site visit can no longer be cancelled." };
   }

   const { error: updateError } = await supabase
      .from("site_visits")
      .update({ status: "cancelled" })
      .eq("id", siteVisitId);

   if (updateError) {
      return { success: false, error: "Failed to cancel the site visit. Please try again." };
   }

   return { success: true };
}

export interface RevealLocationResult {
   success: boolean;
   error?: string;
   exactLat?: number;
   exactLng?: number;
   exactAddress?: string;
}

const LOCATION_NOT_AVAILABLE_MESSAGE =
   "Exact location is not available yet. It will unlock once your site visit is confirmed.";

// Matches the exact `returns table (...)` shape of reveal_exact_location()
// in 0004_leads_site_visits_reveals.sql. A table-returning Postgres
// function comes back from supabase.rpc() as an array of rows with these
// three columns — verified against the migration SQL, not assumed.
interface RevealExactLocationRow {
   exact_lat: number;
   exact_lng: number;
   exact_address: string;
}

/**
 * Reveals the exact location for the buyer's own lead, by calling the
 * existing reveal_exact_location(p_lead_id) RPC exactly as it is defined in
 * 0004_leads_site_visits_reveals.sql.
 *
 * This function intentionally contains NO authorization or eligibility
 * logic of its own. Every check — that the caller is the lead's buyer (or
 * admin), and that the lead has a confirmed/completed site visit or has
 * reached negotiation/closed — is re-derived by the RPC itself from
 * auth.uid() and the lead row, independent of anything sent from the
 * client. This function's only job is: call it, and don't leak details.
 *
 * requireRole(["buyer"]) here is a UI-routing gate (only buyers get this
 * action at all), not a substitute for the RPC's own auth check.
 *
 * Error handling: the RPC raises a Postgres exception for both the
 * "not this lead's buyer" case and the "not yet eligible" case. Neither
 * message is ever passed through to the client — both collapse to the same
 * generic, non-revealing message, so a caller can't use error-message
 * differences to probe why a reveal failed.
 */
export async function revealExactLocation(leadId: string): Promise<RevealLocationResult> {
   if (!leadId || typeof leadId !== "string") {
      return { success: false, error: LOCATION_NOT_AVAILABLE_MESSAGE };
   }

   // requireRole redirects if there is no session — buyer identity is never
   // read from anything the client passes in.
   await requireRole(["buyer"]);
   const supabase = await createClient();

   const { data, error } = await supabase.rpc("reveal_exact_location", { p_lead_id: leadId });
   const rows = data as RevealExactLocationRow[] | null;

   if (error || !rows || rows.length === 0) {
      // Deliberately generic — never surface the RPC's raw exception text
      // (which would otherwise distinguish "not your lead" from "not yet
      // eligible" and give a client a way to probe lead ownership/status).
      return { success: false, error: LOCATION_NOT_AVAILABLE_MESSAGE };
   }

   const row = rows[0];

   return {
      success: true,
      exactLat: row.exact_lat,
      exactLng: row.exact_lng,
      exactAddress: row.exact_address,
   };
}

/**
 * Creates a lead from the site's general "Send Message" contact form
 * (src/components/forms/ContactForm.tsx) — the one on /contact, not tied
 * to any specific property/project and open to anyone, signed in or not.
 *
 * Unlike createInquiry()/createProjectInquiry(), there is no
 * requireRole()/resolveInquiryBuyer() gate here: a visitor filling out the
 * general contact form need not be signed in or even have an account. The
 * row is written with buyer_id/property_id/project_id all NULL and
 * source = 'contact_form', which is the one lead shape
 * 0021_leads_contact_name_and_general_inquiries.sql's
 * "anyone can submit a general contact enquiry" RLS policy allows — every
 * other insert path (buyer_id set, property/project set) is untouched by
 * that policy, so this cannot be used to forge a buyer-owned lead.
 *
 * Because it has no buyer_id, it does not show up on a buyer's "my leads"
 * or a seller's "leads on my properties" — only "admins can read all
 * leads" (0004) sees it, i.e. it lands in Admin -> Leads exactly like every
 * other enquiry.
 */
export async function createGeneralInquiry(contact: GeneralContactInput): Promise<ActionResult> {
   const normalized = normalizeGeneralContact(contact);
   if (!normalized.ok) {
      return { success: false, error: normalized.error };
   }

   const supabase = await createClient();

   const { error: insertError } = await supabase.from("leads").insert({
      buyer_id: null,
      property_id: null,
      project_id: null,
      source: "contact_form",
      contact_name: normalized.value.contact_name,
      contact_email: normalized.value.contact_email,
      contact_phone: normalized.value.contact_phone,
      message: normalized.value.message,
      // status intentionally omitted — column default is 'new'.
   });

   if (insertError) {
      return { success: false, error: "Failed to send your message. Please try again." };
   }

   return { success: true };
}

// Message length is validated in inquiryInput.ts (MAX_INQUIRY_MESSAGE_LENGTH).

/**
 * Creates (or, if one already exists, safely no-ops on) a buyer inquiry for
 * a published project as a whole — not any specific plot/listing. Called
 * from a project detail page's "Interested in <Project>?" enquiry form
 * (see section 26 of the Property Planet master prompt: project_id set,
 * property_id NULL).
 *
 * Mirrors createInquiry() above field-for-field:
 *   - identity (buyer_id) is always requireRole(["buyer"]).userId, never
 *     client input;
 *   - the id is re-validated against `project_public`, not `projects`, so
 *     an unpublished/draft project id can never be inquired against, the
 *     same way an unpublished property id can't via property_public;
 *   - a unique-violation is treated as "you already inquired", not an
 *     error — this relies on the leads_buyer_project_unique partial index
 *     added in 0013_leads_project_id.sql (unique on (buyer_id, project_id)
 *     where property_id is null), which is the project-level equivalent of
 *     the existing (buyer_id, property_id) uniqueness createInquiry()
 *     already depends on.
 *
 * property_id is always omitted (column default NULL) — this action never
 * creates or touches a plot-level lead.
 */
export async function createProjectInquiry(
   projectId: string,
   contact: InquiryContactInput = {},
): Promise<ActionResult> {
   if (!projectId || typeof projectId !== "string") {
      return { success: false, error: "A project is required." };
   }

   // Same non-redirecting buyer resolution as createInquiry(), for the same
   // reason: an enquiry opened from a project card must not navigate the
   // buyer away from the project.
   const buyer = await resolveInquiryBuyer();
   if (!buyer.ok) {
      return { success: false, error: buyer.error, needsAuth: buyer.needsAuth };
   }

   const normalized = normalizeInquiryContact(contact);
   if (!normalized.ok) {
      return { success: false, error: normalized.error };
   }

   const supabase = await createClient();

   // Re-derive that the project is real AND published — never trust that
   // the id the client posted corresponds to a live, public project, same
   // reasoning as createInquiry()'s property_public lookup above.
   const { data: project, error: projectError } = await supabase
      .from("project_public")
      .select("id")
      .eq("id", projectId)
      .maybeSingle();

   if (projectError || !project) {
      return { success: false, error: "This project is no longer available." };
   }

   const { error: insertError } = await supabase.from("leads").insert({
      buyer_id: buyer.userId,
      project_id: projectId,
      property_id: null,
      message: normalized.value.message,
      contact_name: normalized.value.contact_name,
      contact_phone: normalized.value.contact_phone,
      preferred_date: normalized.value.preferred_date,
      preferred_time: normalized.value.preferred_time,
      // status intentionally omitted — column default is 'new', same as
      // createInquiry(). Buyers have no UPDATE policy on leads at all (see
      // file header), so this insert is the only write this function ever
      // performs.
   });

   if (insertError) {
      if (insertError.code === UNIQUE_VIOLATION) {
         // Buyer already has a project-level lead on this project. Same
         // neutral, non-error treatment as createInquiry()'s duplicate case.
         return { success: true, alreadyExists: true };
      }
      return { success: false, error: "Failed to send inquiry. Please try again." };
   }

   await backfillProfilePhone(supabase, buyer.userId, normalized.value.contact_phone);

   return { success: true };
}