// src/lib/leads/sellerQueries.ts
//
// Seller-facing lead reads. A seller learns THAT a buyer enquired about one
// of their properties -- buyer name, property, date, status, message -- but
// never the buyer's phone/email. Property Planet (admin) coordinates the
// buyer and seller from there.
//
// The boundary is in the database, not here: sellers have NO access to the
// base `leads` table (0029_lead_privacy_seller_view.sql). The only thing they
// can read is the `seller_leads` view, which is hard-filtered to properties
// they own and whose column list does not contain contact_phone /
// contact_email / buyer_id. This file only ever selects from that view, so
// there is nothing to "hide" in the UI -- the fields are never sent.

import { createClient } from "@/lib/supabase/server";
import type { LeadStatus } from "@/lib/leads/queries";

export interface SellerLead {
   id: string;
   buyerName: string;
   propertyId: string;
   propertyTitle: string;
   propertySlug: string | null;
   message: string | null;
   status: LeadStatus;
   createdAt: string;
}

/** Leads on the caller's own properties, newest first. Empty (never throws) on any failure. */
export async function getSellerLeads(): Promise<SellerLead[]> {
   const supabase = await createClient();

   const { data, error } = await supabase
      .from("seller_leads")
      .select("id, property_id, property_title, property_slug, buyer_name, message, status, created_at")
      .order("created_at", { ascending: false });

   if (error || !data) {
      if (error) console.error("Failed to load seller leads:", error.message);
      return [];
   }

   return data.map((row) => ({
      id: row.id,
      buyerName: row.buyer_name ?? "Buyer",
      propertyId: row.property_id,
      propertyTitle: row.property_title,
      propertySlug: row.property_slug ?? null,
      message: row.message ?? null,
      status: row.status as LeadStatus,
      createdAt: row.created_at,
   }));
}
