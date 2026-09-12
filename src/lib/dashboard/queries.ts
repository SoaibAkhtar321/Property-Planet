// src/lib/dashboard/queries.ts
//
// Replaces the hardcoded template numbers ("1.7k+ properties", "4.8k
// views", etc.) that used to live directly in DashboardBody.tsx with
// real, role-aware counts pulled from the tables that already exist
// (properties, leads). Buyer and seller each get the stats relevant to
// them; a seller sees seller stats plus their own buyer-side activity
// (their submitted leads), since a seller account is a buyer account
// with extra capability, not a separate mode.
//
// No "Total Views" card: there is no view-tracking table in the schema,
// so that stat can't be made real without inventing data — it's dropped
// rather than left fake.

import { createClient } from "@/lib/supabase/server";
import type { AuthContext } from "@/lib/auth/session";

export interface DashboardStat {
   id: string;
   title: string;
   value: string;
}

/** Buyer-side stats: shown for every logged-in user (buyer or seller). */
async function getBuyerStats(supabase: Awaited<ReturnType<typeof createClient>>, userId: string): Promise<DashboardStat[]> {
   const { count: totalLeads } = await supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("buyer_id", userId);

   const { count: openLeads } = await supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("buyer_id", userId)
      .in("status", ["new", "contacted", "qualified", "site_visit", "negotiation"]);

   return [
      { id: "buyer-enquiries", title: "My Enquiries", value: String(totalLeads ?? 0) },
      { id: "buyer-open", title: "Open Enquiries", value: String(openLeads ?? 0) },
   ];
}

/** Seller-side stats: shown in addition to buyer stats when role === 'seller'. */
async function getSellerStats(supabase: Awaited<ReturnType<typeof createClient>>, userId: string): Promise<DashboardStat[]> {
   const { count: totalProperties } = await supabase
      .from("properties")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", userId);

   const { count: publishedProperties } = await supabase
      .from("properties")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", userId)
      .eq("status", "published");

   const { count: pendingProperties } = await supabase
      .from("properties")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", userId)
      .in("status", ["draft", "pending"]);

   // Leads received on properties this seller owns.
   const { data: ownedPropertyIds } = await supabase
      .from("properties")
      .select("id")
      .eq("owner_id", userId);

   let leadsReceived = 0;
   if (ownedPropertyIds && ownedPropertyIds.length > 0) {
      const { count } = await supabase
         .from("leads")
         .select("id", { count: "exact", head: true })
         .in("property_id", ownedPropertyIds.map((p) => p.id));
      leadsReceived = count ?? 0;
   }

   return [
      { id: "seller-total", title: "My Properties", value: String(totalProperties ?? 0) },
      { id: "seller-published", title: "Published", value: String(publishedProperties ?? 0) },
      { id: "seller-pending", title: "Pending Approval", value: String(pendingProperties ?? 0) },
      { id: "seller-leads", title: "Leads Received", value: String(leadsReceived) },
   ];
}

/**
 * Returns the dashboard summary cards for the given user. A seller's
 * cards include their buyer-side activity too — one unified dashboard,
 * not a mode switch — since a seller account keeps full buyer
 * functionality.
 */
export async function getDashboardSummary(ctx: AuthContext): Promise<DashboardStat[]> {
   const supabase = await createClient();

   if (ctx.role === "seller") {
      const [sellerStats, buyerStats] = await Promise.all([
         getSellerStats(supabase, ctx.userId),
         getBuyerStats(supabase, ctx.userId),
      ]);
      return [...sellerStats, ...buyerStats];
   }

   // Buyer (and any future non-seller, non-admin role) just gets buyer stats.
   return getBuyerStats(supabase, ctx.userId);
}
