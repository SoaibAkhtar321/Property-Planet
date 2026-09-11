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

export interface AdminLeadListRow {
   id: string;
   status: LeadStatus;
   message: string | null;
   created_at: string;
   buyer_id: string;
   buyer_name: string | null;
   buyer_phone: string | null;
   buyer_email: string | null;
   property_id: string;
   property_title: string;
   property_slug: string;
   seller_id: string;
   seller_name: string | null;
}

export interface AdminLeadFilters {
   status?: LeadStatus;
   search?: string; // matches buyer name or property title
}

interface LeadJoinRow {
   id: string;
   status: LeadStatus;
   message: string | null;
   created_at: string;
   buyer_id: string;
   property_id: string;
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
      .select("id, status, message, created_at, buyer_id, property_id")
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
   const buyerIds = Array.from(new Set(leadRows.map((l) => l.buyer_id)));
   const propertyIds = Array.from(new Set(leadRows.map((l) => l.property_id)));

   const [{ data: buyerProfiles, error: buyerError }, { data: properties, error: propError }] = await Promise.all([
      supabase.from("profiles").select("id, full_name, phone").in("id", buyerIds),
      supabase.from("properties").select("id, title, slug, owner_id").in("id", propertyIds),
   ]);

   if (buyerError) console.error("Failed to load buyer profiles for leads:", buyerError.message);
   if (propError) console.error("Failed to load properties for leads:", propError.message);

   const buyerById = new Map((buyerProfiles ?? []).map((p) => [p.id, p]));
   const propertyById = new Map((properties ?? []).map((p) => [p.id, p]));

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
      const buyer = buyerById.get(lead.buyer_id);
      const property = propertyById.get(lead.property_id);
      const seller = property ? sellerById.get(property.owner_id) : undefined;

      return {
         id: lead.id,
         status: lead.status,
         message: lead.message,
         created_at: lead.created_at,
         buyer_id: lead.buyer_id,
         buyer_name: buyer?.full_name ?? null,
         buyer_phone: buyer?.phone ?? null,
         buyer_email: null,
         property_id: lead.property_id,
         property_title: property?.title ?? "(property removed)",
         property_slug: property?.slug ?? "",
         seller_id: property?.owner_id ?? "",
         seller_name: seller?.full_name ?? null,
      };
   });

   if (!filters.search) return rows;

   const term = filters.search.trim().toLowerCase();
   if (!term) return rows;

   return rows.filter(
      (r) =>
         (r.buyer_name ?? "").toLowerCase().includes(term) ||
         r.property_title.toLowerCase().includes(term) ||
         (r.seller_name ?? "").toLowerCase().includes(term)
   );
}

export interface AdminLeadDetail extends AdminLeadListRow {
   property_type: string;
   listing_type: string;
   property_status: string;
   city: string;
   locality: string;
   seller_phone: string | null;
   site_visits: { id: string; scheduled_at: string | null; status: string; notes: string | null }[];
}

/** A single lead with full buyer + property + seller detail, for /admin/leads/[id]. Null if not found. */
export async function getAdminLeadDetail(id: string): Promise<AdminLeadDetail | null> {
   const supabase = await createClient();

   const { data: lead, error } = await supabase
      .from("leads")
      .select("id, status, message, created_at, buyer_id, property_id")
      .eq("id", id)
      .maybeSingle();

   if (error) {
      console.error("Failed to load lead for admin:", error.message);
      return null;
   }
   if (!lead) return null;

   const [{ data: buyer }, { data: property }, { data: siteVisits, error: svError }] = await Promise.all([
      supabase.from("profiles").select("id, full_name, phone").eq("id", lead.buyer_id).maybeSingle(),
      supabase
         .from("properties")
         .select("id, title, slug, owner_id, property_type, listing_type, status, city, locality")
         .eq("id", lead.property_id)
         .maybeSingle(),
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

   return {
      id: lead.id,
      status: lead.status as LeadStatus,
      message: lead.message,
      created_at: lead.created_at,
      buyer_id: lead.buyer_id,
      buyer_name: buyer?.full_name ?? null,
      buyer_phone: buyer?.phone ?? null,
      buyer_email: null,
      property_id: lead.property_id,
      property_title: property?.title ?? "(property removed)",
      property_slug: property?.slug ?? "",
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
