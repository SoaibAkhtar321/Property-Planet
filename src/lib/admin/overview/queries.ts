// src/lib/admin/overview/queries.ts
//
// Real Supabase-backed metrics for the /admin overview page. Every number
// here comes from a `select(..., { count: "exact", head: true })` query
// against the base tables — no hardcoded/demo values. Reads go through the
// RLS-respecting createClient() (never a service client); every count
// query below is authorized by the existing "admins can read all ..."
// policies (0001/0002/0004), same as every other admin query in this app.
//
// Queries run in parallel via Promise.all — this is a dashboard read, not
// a transaction, so there's no correctness reason to serialize them.

import { createClient } from "@/lib/supabase/server";

export interface AdminOverviewMetrics {
   properties: {
      published: number;
      pending: number;
      rejected: number;
      draft: number;
   };
   leads: {
      total: number;
      new: number;
      contacted: number;
      thisWeek: number;
      converted: number; // negotiation + closed, i.e. progressed to a deal
      closed: number;
   };
   users: {
      buyers: number;
      sellers: number;
      admins: number;
   };
}

const EMPTY_METRICS: AdminOverviewMetrics = {
   properties: { published: 0, pending: 0, rejected: 0, draft: 0 },
   leads: { total: 0, new: 0, contacted: 0, thisWeek: 0, converted: 0, closed: 0 },
   users: { buyers: 0, sellers: 0, admins: 0 },
};

/** All metrics for the /admin overview page. Never throws — failed counts fall back to 0 with a logged error. */
export async function getAdminOverviewMetrics(): Promise<AdminOverviewMetrics> {
   const supabase = await createClient();
   const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

   const results = await Promise.all([
      supabase.from("properties").select("id", { count: "exact", head: true }).eq("status", "published"),
      supabase.from("properties").select("id", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("properties").select("id", { count: "exact", head: true }).eq("status", "rejected"),
      supabase.from("properties").select("id", { count: "exact", head: true }).eq("status", "draft"),
      supabase.from("leads").select("id", { count: "exact", head: true }),
      supabase.from("leads").select("id", { count: "exact", head: true }).eq("status", "new"),
      supabase.from("leads").select("id", { count: "exact", head: true }).eq("status", "contacted"),
      supabase.from("leads").select("id", { count: "exact", head: true }).gte("created_at", weekAgo),
      supabase.from("leads").select("id", { count: "exact", head: true }).eq("status", "negotiation"),
      supabase.from("leads").select("id", { count: "exact", head: true }).eq("status", "closed"),
      supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "buyer"),
      supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "seller"),
      supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "admin"),
   ]);

   const labels = [
      "published properties",
      "pending properties",
      "rejected properties",
      "draft properties",
      "total leads",
      "new leads",
      "contacted leads",
      "leads this week",
      "negotiation leads",
      "closed leads",
      "buyers",
      "sellers",
      "admins",
   ];

   const counts = results.map((r, i) => {
      if (r.error) {
         console.error(`Failed to count ${labels[i]}:`, r.error.message);
         return 0;
      }
      return r.count ?? 0;
   });

   const [
      published,
      pending,
      rejected,
      draft,
      totalLeads,
      newLeads,
      contactedLeads,
      leadsThisWeek,
      negotiationLeads,
      closedLeads,
      buyers,
      sellers,
      admins,
   ] = counts;

   return {
      properties: { published, pending, rejected, draft },
      leads: {
         total: totalLeads,
         new: newLeads,
         contacted: contactedLeads,
         thisWeek: leadsThisWeek,
         converted: negotiationLeads + closedLeads,
         closed: closedLeads,
      },
      users: { buyers, sellers, admins },
   };
}

export { EMPTY_METRICS };
