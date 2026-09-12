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
// createInquiry also now copies properties.project_id (if any) onto the
// lead it creates, so a plot enquiry preserves project context per section
// 27 of the master prompt. See createInquiry's own doc comment for why
// that lookup queries `properties` directly rather than `property_public`.
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

export interface ActionResult {
   success: boolean;
   error?: string;
   alreadyExists?: boolean;
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
const MAX_INQUIRY_MESSAGE_LENGTH = 1000;

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
 * This second lookup queries the `properties` base table directly, not
 * `property_public` (property_public does not expose project_id — adding
 * it would be a schema change, deferred). This is still safe: the row was
 * already confirmed published via property_public immediately above, and
 * the "published properties are public" RLS policy on `properties` grants
 * an equivalent unconditional read of every column (including project_id)
 * on a published row to any authenticated caller, buyer or otherwise —
 * this lookup can't see anything a buyer isn't already entitled to see.
 * If this second query fails for any reason, project_id is simply left
 * NULL rather than failing the whole inquiry — the property/property_id
 * side of the lead is unaffected either way.
 */
export async function createInquiry(propertyId: string, message?: string): Promise<ActionResult> {
   if (!propertyId || typeof propertyId !== "string") {
      return { success: false, error: "A property is required." };
   }

   // requireRole redirects (rather than returning) if there is no session or
   // the caller isn't a buyer — same fail-closed behavior as every other
   // action in src/lib/properties/actions.ts.
   const ctx = await requireRole(["buyer"]);
   const supabase = await createClient();

   // Re-derive that the property is real AND published — never trust that
   // the id the client posted corresponds to a live, public listing.
   const { data: property, error: propertyError } = await supabase
      .from("property_public")
      .select("id")
      .eq("id", propertyId)
      .maybeSingle();

   if (propertyError || !property) {
      return { success: false, error: "This property is no longer available." };
   }

   // Best-effort project-context lookup — see function doc comment above.
   // Deliberately non-fatal: a failure here should never block the buyer's
   // actual inquiry, just leave the lead's project_id NULL, same as it is
   // today for a projectless property.
   const { data: propertyRow } = await supabase
      .from("properties")
      .select("project_id")
      .eq("id", propertyId)
      .maybeSingle();

   const trimmedMessage = message?.trim();
   if (trimmedMessage && trimmedMessage.length > MAX_INQUIRY_MESSAGE_LENGTH) {
      return { success: false, error: `Message must be ${MAX_INQUIRY_MESSAGE_LENGTH} characters or fewer.` };
   }

   const { error: insertError } = await supabase.from("leads").insert({
      buyer_id: ctx.userId,
      property_id: propertyId,
      project_id: propertyRow?.project_id ?? null,
      message: trimmedMessage ? trimmedMessage : null,
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
      .select("id, buyer_id")
      .eq("id", leadId)
      .maybeSingle();

   if (leadError || !lead || lead.buyer_id !== ctx.userId) {
      return { success: false, error: "This inquiry could not be found." };
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

const MAX_PROJECT_INQUIRY_MESSAGE_LENGTH = 1000;

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
export async function createProjectInquiry(projectId: string, message?: string): Promise<ActionResult> {
   if (!projectId || typeof projectId !== "string") {
      return { success: false, error: "A project is required." };
   }

   // requireRole redirects (rather than returning) if there is no session or
   // the caller isn't a buyer — same fail-closed behavior as createInquiry().
   const ctx = await requireRole(["buyer"]);
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

   const trimmedMessage = message?.trim();
   if (trimmedMessage && trimmedMessage.length > MAX_PROJECT_INQUIRY_MESSAGE_LENGTH) {
      return { success: false, error: `Message must be ${MAX_PROJECT_INQUIRY_MESSAGE_LENGTH} characters or fewer.` };
   }

   const { error: insertError } = await supabase.from("leads").insert({
      buyer_id: ctx.userId,
      project_id: projectId,
      property_id: null,
      message: trimmedMessage ? trimmedMessage : null,
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

   return { success: true };
}