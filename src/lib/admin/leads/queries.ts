// src/lib/admin/leads/queries.ts
//
// Admin-only lead reads for /admin/leads. Reads the base `leads` table
// directly (not any restricted view) — this is safe because every call
// site is behind requireAdmin() (src/app/admin/**), the read still goes
// through createClient() (RLS-respecting, not the service-role client),
// and "admins can read all leads" (0004_leads_site_visits_reveals.sql) is
// what actually authorizes seeing every buyer's lead.
//
// Buyer contact info: leads.message can contain free text, but the actual
// buyer identity (name/phone/email) lives on `profiles`, which the admin
// already has "admins can read all profiles" access to (0001). This file
// joins leads -> profiles (buyer) and leads -> properties -> profiles
// (seller) explicitly, rather than relying on any Supabase embedded-join
// shorthand, so the exact columns selected are visible and auditable here.
//
// This is the one place in the app that intentionally reads both sides of
// a lead (buyer + seller) together — see project brief section 7: the
// admin is the only role permitted to see both, and the seller's own
// lead read (0004's "sellers can read leads on own properties" policy)
// stays untouched by anything in this file; nothing here grants that
// policy, it already existed.

import { createClient } from "@/lib/supabase/server";

export type LeadStatus = "new" | "contacted" | "qualified" | "site_visit" | "negotiation" | "closed" | "lost";

/**
 * Phase 11: which of the three shapes a lead is, derived from the row
 * itself rather than stored as a column — `leads` already carries enough
 * to tell them apart (0013_leads_project_id.sql), so no enum, no extra
 * column, and no second CRM.
 *
 *   project    -> project_id set, property_id NULL
 *   unit       -> property_id set AND that property has a project_id
 *   individual -> property_id set, no project
 */
export type LeadKind = "project" | "unit" | "individual" | "general";

export const LEAD_KIND_LABELS: Record<LeadKind, string> = {
   project: "Project enquiry",
   unit: "Project unit enquiry",
   individual: "Individual property enquiry",
   general: "General contact form",
};

export interface AdminLeadListRow {
   id: string;
   kind: LeadKind;
   status: LeadStatus;
   message: string | null;
   created_at: string;
   buyer_id: string | null;
   /** Name given with this enquiry — from `profiles` for a signed-in buyer,
    *  or leads.contact_name directly for a general contact-form lead. */
   buyer_name: string | null;
   buyer_phone: string | null;
   buyer_email: string | null;
   /** NULL on a project-level lead. */
   property_id: string | null;
   property_title: string | null;
   property_slug: string | null;
   /** Set on a project lead and on a unit lead; NULL on an individual one. */
   project_id: string | null;
   project_title: string | null;
   project_slug: string | null;
   seller_id: string;
   seller_name: string | null;
}

export interface AdminLeadFilters {
   status?: LeadStatus;
   kind?: LeadKind;
   search?: string; // matches buyer name, property title, project title or seller name
}

export const LEAD_KINDS: LeadKind[] = ["individual", "unit", "project", "general"];

interface LeadJoinRow {
   id: string;
   status: LeadStatus;
   message: string | null;
   created_at: string;
   buyer_id: string | null;
   property_id: string | null;
   project_id: string | null;
   /** Present on every lead since 0021; only ever populated on a general
    *  contact-form lead do contact_name/contact_email stand in for a
    *  missing buyer profile. */
   source: string | null;
   contact_name: string | null;
   contact_email: string | null;
   contact_phone: string | null;
}

/**
 * Leads for the /admin/leads list, newest first, with buyer/property/seller
 * details resolved. Filters are applied in-memory after the base fetch
 * (buyer/property fields live on other tables) — fine at this app's scale;
 * if this ever needs server-side pagination, push status filtering into
 * the first query (it's a plain column) and keep search client-side.
 */
export async function getAdminLeads(filters: AdminLeadFilters = {}): Promise<AdminLeadListRow[]> {
   const supabase = await createClient();

   let query = supabase
      .from("leads")
      .select(
         "id, status, message, created_at, buyer_id, property_id, project_id, source, contact_name, contact_email, contact_phone"
      )
      .order("created_at", { ascending: false });

   if (filters.status) {
      query = query.eq("status", filters.status);
   }

   const { data: leads, error } = await query;

   if (error) {
      console.error("Failed to load admin leads:", error.message);
      return [];
   }
   if (!leads || leads.length === 0) return [];

   const leadRows = leads as LeadJoinRow[];
   const buyerIds = Array.from(
      new Set(leadRows.map((l) => l.buyer_id).filter((id): id is string => Boolean(id)))
   );
   // property_id is nullable since 0013 (project-level leads), so the id
   // lists are filtered before they are used as `in()` arguments.
   const propertyIds = Array.from(new Set(leadRows.map((l) => l.property_id).filter((id): id is string => Boolean(id))));
   const leadProjectIds = Array.from(new Set(leadRows.map((l) => l.project_id).filter((id): id is string => Boolean(id))));

   const [{ data: buyerProfiles, error: buyerError }, { data: properties, error: propError }] = await Promise.all([
      supabase.from("profiles").select("id, full_name, phone").in("id", buyerIds),
      propertyIds.length
         ? supabase.from("properties").select("id, title, slug, owner_id, project_id").in("id", propertyIds)
         : Promise.resolve({ data: [], error: null }),
   ]);

   if (buyerError) console.error("Failed to load buyer profiles for leads:", buyerError.message);
   if (propError) console.error("Failed to load properties for leads:", propError.message);

   const buyerById = new Map((buyerProfiles ?? []).map((p) => [p.id, p]));
   const propertyById = new Map((properties ?? []).map((p) => [p.id, p]));

   // A unit lead carries its parent project on the lead row, but fall back
   // to the property's own project_id so a legacy row written before 0013
   // still resolves to the right project.
   const projectIds = Array.from(
      new Set([
         ...leadProjectIds,
         ...(properties ?? []).map((p) => p.project_id as string | null).filter((id): id is string => Boolean(id)),
      ])
   );

   const { data: projects, error: projectError } = projectIds.length
      ? await supabase.from("projects").select("id, title, slug").in("id", projectIds)
      : { data: [], error: null };

   if (projectError) console.error("Failed to load projects for leads:", projectError.message);

   const projectById = new Map((projects ?? []).map((p) => [p.id, p]));

   const sellerIds = Array.from(new Set((properties ?? []).map((p) => p.owner_id).filter(Boolean)));
   const { data: sellerProfiles, error: sellerError } = sellerIds.length
      ? await supabase.from("profiles").select("id, full_name").in("id", sellerIds)
      : { data: [], error: null };

   if (sellerError) console.error("Failed to load seller profiles for leads:", sellerError.message);

   const sellerById = new Map((sellerProfiles ?? []).map((p) => [p.id, p]));

   // Buyer email isn't stored in `profiles` — Supabase Auth owns email on
   // auth.users, which this client-side createClient() has no admin access
   // to read for other users. Buyer contact here is therefore phone (the
   // field the schema actually gives admins for this) plus name; there is
   // no email column to surface without a service-role auth.admin call,
   // which this app deliberately does not use for RLS-respecting reads.
   const rows: AdminLeadListRow[] = leadRows.map((lead) => {
      const buyer = lead.buyer_id ? buyerById.get(lead.buyer_id) : undefined;
      const property = lead.property_id ? propertyById.get(lead.property_id) : undefined;
      const seller = property ? sellerById.get(property.owner_id) : undefined;
      const projectId = lead.project_id ?? (property?.project_id as string | null) ?? null;
      const project = projectId ? projectById.get(projectId) : undefined;

      const kind: LeadKind =
         lead.source === "contact_form"
            ? "general"
            : !lead.property_id
              ? "project"
              : projectId
                ? "unit"
                : "individual";

      return {
         id: lead.id,
         kind,
         status: lead.status,
         message: lead.message,
         created_at: lead.created_at,
         buyer_id: lead.buyer_id,
         // Prefer the name/phone given with this specific enquiry
         // (leads.contact_name/contact_phone, 0020/0021) over the buyer's
         // profile — falls back to the profile only for pre-0021 rows that
         // predate contact_name.
         buyer_name: lead.contact_name ?? buyer?.full_name ?? null,
         buyer_phone: lead.contact_phone ?? buyer?.phone ?? null,
         buyer_email: lead.contact_email ?? null,
         property_id: lead.property_id,
         property_title: lead.property_id ? property?.title ?? "(property removed)" : null,
         property_slug: property?.slug ?? null,
         project_id: projectId,
         project_title: projectId ? project?.title ?? "(project removed)" : null,
         project_slug: project?.slug ?? null,
         seller_id: property?.owner_id ?? "",
         seller_name: seller?.full_name ?? null,
      };
   });

   const byKind = filters.kind ? rows.filter((r) => r.kind === filters.kind) : rows;

   if (!filters.search) return byKind;

   const term = filters.search.trim().toLowerCase();
   if (!term) return byKind;

   return byKind.filter(
      (r) =>
         (r.buyer_name ?? "").toLowerCase().includes(term) ||
         (r.property_title ?? "").toLowerCase().includes(term) ||
         (r.project_title ?? "").toLowerCase().includes(term) ||
         (r.seller_name ?? "").toLowerCase().includes(term)
   );
}

export interface AdminLeadDetail extends AdminLeadListRow {
   property_type: string;
   listing_type: string;
   property_status: string;
   city: string;
   locality: string;
   project_status: string | null;
   seller_phone: string | null;
   site_visits: { id: string; scheduled_at: string | null; status: string; notes: string | null }[];
}

/** A single lead with full buyer + property + seller detail, for /admin/leads/[id]. Null if not found. */
export async function getAdminLeadDetail(id: string): Promise<AdminLeadDetail | null> {
   const supabase = await createClient();

   const { data: lead, error } = await supabase
      .from("leads")
      .select(
         "id, status, message, created_at, buyer_id, property_id, project_id, source, contact_name, contact_email, contact_phone"
      )
      .eq("id", id)
      .maybeSingle();

   if (error) {
      console.error("Failed to load lead for admin:", error.message);
      return null;
   }
   if (!lead) return null;

   const [{ data: buyer }, { data: property }, { data: siteVisits, error: svError }] = await Promise.all([
      lead.buyer_id
         ? supabase.from("profiles").select("id, full_name, phone").eq("id", lead.buyer_id).maybeSingle()
         : Promise.resolve({ data: null }),
      // property_id is NULL on a project-level lead (0013) — skip the
      // lookup entirely rather than querying `.eq("id", null)`.
      lead.property_id
         ? supabase
              .from("properties")
              .select("id, title, slug, owner_id, property_type, listing_type, status, city, locality, project_id")
              .eq("id", lead.property_id)
              .maybeSingle()
         : Promise.resolve({ data: null }),
      supabase
         .from("site_visits")
         .select("id, scheduled_at, status, notes")
         .eq("lead_id", id)
         .order("scheduled_at", { ascending: false }),
   ]);

   if (svError) console.error("Failed to load site visits for lead:", svError.message);

   let seller: { id: string; full_name: string | null; phone: string | null } | null = null;
   if (property?.owner_id) {
      const { data } = await supabase
         .from("profiles")
         .select("id, full_name, phone")
         .eq("id", property.owner_id)
         .maybeSingle();
      seller = data ?? null;
   }

   const projectId = lead.project_id ?? (property?.project_id as string | null) ?? null;
   let project: { id: string; title: string; slug: string; status: string } | null = null;
   if (projectId) {
      const { data } = await supabase.from("projects").select("id, title, slug, status").eq("id", projectId).maybeSingle();
      project = data ?? null;
   }

   const kind: LeadKind =
      lead.source === "contact_form"
         ? "general"
         : !lead.property_id
           ? "project"
           : projectId
             ? "unit"
             : "individual";

   return {
      id: lead.id,
      kind,
      status: lead.status as LeadStatus,
      message: lead.message,
      created_at: lead.created_at,
      buyer_id: lead.buyer_id,
      buyer_name: lead.contact_name ?? buyer?.full_name ?? null,
      buyer_phone: lead.contact_phone ?? buyer?.phone ?? null,
      buyer_email: lead.contact_email ?? null,
      property_id: lead.property_id,
      property_title: lead.property_id ? property?.title ?? "(property removed)" : null,
      property_slug: property?.slug ?? null,
      project_id: projectId,
      project_title: projectId ? project?.title ?? "(project removed)" : null,
      project_slug: project?.slug ?? null,
      project_status: project?.status ?? null,
      property_type: property?.property_type ?? "",
      listing_type: property?.listing_type ?? "",
      property_status: property?.status ?? "",
      city: property?.city ?? "",
      locality: property?.locality ?? "",
      seller_id: property?.owner_id ?? "",
      seller_name: seller?.full_name ?? null,
      seller_phone: seller?.phone ?? null,
      site_visits: siteVisits ?? [],
   };
}
