// src/lib/ai/insights.ts
//
// Data behind the admin and seller "AI insights" pages.
//
// Every number here is COMPUTED from real rows (search log, listings,
// leads). Gemini only turns those aggregates into a short written summary
// with suggested actions — it never invents figures, and it is never sent
// buyer names, phones, emails or exact addresses: only counts, titles,
// localities and prices that are already public.
//
// Reads go through the caller's RLS-scoped client (admin sees all; a
// seller sees only their own rows). The pages calling these functions are
// already behind requireAdmin() / requireRole(["seller"]).

import { createClient, createServiceClient } from "@/lib/supabase/server";
import { formatINR } from "@/utils/propertyPlanetAIEngine";

const DAY_MS = 24 * 60 * 60 * 1000;
const WINDOW_DAYS = 30;

const normQuery = (q: string) => q.toLowerCase().replace(/\s+/g, " ").trim();
const median = (values: number[]) => {
   if (values.length === 0) return null;
   const sorted = [...values].sort((a, b) => a - b);
   const mid = Math.floor(sorted.length / 2);
   return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

function topCounts<T extends string>(items: T[], limit: number) {
   const counts = new Map<T, number>();
   for (const item of items) counts.set(item, (counts.get(item) ?? 0) + 1);
   return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, limit);
}

// ===========================================================================
// Admin
// ===========================================================================

export interface AdminInsightData {
   windowDays: number;
   searchLogAvailable: boolean;
   searches: {
      total: number;
      aiInterpreted: number;
      zeroResultShare: number; // 0..1
      topQueries: { query: string; count: number; avgResults: number }[];
      zeroResultQueries: { query: string; count: number }[];
   };
   demandVsSupply: { locality: string; searches: number; listings: number }[];
   leads: {
      total: number;
      byStatus: { status: string; count: number }[];
      topListings: { title: string; slug: string | null; count: number }[];
   };
   moderation: { pending: number; oldestPendingDays: number | null };
   quality: {
      noPhotos: { id: string; title: string }[];
      shortDescription: { id: string; title: string }[];
   };
   search: { published: number; indexed: number | null };
}

export async function getAdminInsightData(): Promise<AdminInsightData> {
   const supabase = await createClient();
   const since = new Date(Date.now() - WINDOW_DAYS * DAY_MS).toISOString();

   const [logRes, supplyRes, leadsRes, pendingRes, publishedRes] = await Promise.all([
      supabase
         .from("property_search_log")
         .select("query, interpreted, result_count, used_ai")
         .gte("created_at", since)
         .order("created_at", { ascending: false })
         .limit(5000),
      supabase.from("property_public").select("locality").is("project_id", null).eq("listing_type", "sale").limit(2000),
      supabase.from("leads").select("status, property_id").gte("created_at", since).limit(5000),
      supabase.from("properties").select("created_at").eq("status", "pending").order("created_at", { ascending: true }).limit(500),
      supabase.from("properties").select("id, title, description").eq("status", "published").limit(2000),
   ]);

   // --- searches ------------------------------------------------------------
   const logs = (logRes.data ?? []) as { query: string; interpreted: Record<string, unknown> | null; result_count: number; used_ai: boolean }[];
   const byQuery = new Map<string, { count: number; results: number }>();
   for (const row of logs) {
      const key = normQuery(row.query);
      const entry = byQuery.get(key) ?? { count: 0, results: 0 };
      entry.count += 1;
      entry.results += row.result_count;
      byQuery.set(key, entry);
   }
   const topQueries = [...byQuery.entries()]
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10)
      .map(([query, v]) => ({ query, count: v.count, avgResults: Math.round((v.results / v.count) * 10) / 10 }));
   const zeroResultQueries = topCounts(
      logs.filter((r) => r.result_count === 0).map((r) => normQuery(r.query)),
      10,
   ).map(([query, count]) => ({ query, count }));

   // --- demand vs supply ----------------------------------------------------
   const supplyCounts = new Map<string, { label: string; n: number }>();
   for (const row of (supplyRes.data ?? []) as { locality: string | null }[]) {
      if (!row.locality) continue;
      const key = row.locality.toLowerCase().trim();
      const entry = supplyCounts.get(key) ?? { label: row.locality, n: 0 };
      entry.n += 1;
      supplyCounts.set(key, entry);
   }
   const demandLocalities = logs
      .map((r) => (typeof r.interpreted?.locality === "string" ? (r.interpreted.locality as string) : null))
      .filter((l): l is string => Boolean(l));
   const demandVsSupply = topCounts(demandLocalities.map((l) => l.toLowerCase().trim()), 12).map(([key, searches]) => ({
      locality: supplyCounts.get(key)?.label ?? key,
      searches,
      listings: supplyCounts.get(key)?.n ?? 0,
   }));

   // --- leads ---------------------------------------------------------------
   const leads = (leadsRes.data ?? []) as { status: string; property_id: string | null }[];
   const byStatus = topCounts(leads.map((l) => l.status), 10).map(([status, count]) => ({ status, count }));
   const topPropertyIds = topCounts(
      leads.map((l) => l.property_id).filter((id): id is string => Boolean(id)),
      5,
   );
   let topListings: AdminInsightData["leads"]["topListings"] = [];
   if (topPropertyIds.length > 0) {
      const { data: titled } = await supabase
         .from("properties")
         .select("id, title, slug")
         .in("id", topPropertyIds.map(([id]) => id));
      const byId = new Map((titled ?? []).map((p) => [p.id as string, p]));
      topListings = topPropertyIds.map(([id, count]) => ({
         title: (byId.get(id)?.title as string) ?? "Listing",
         slug: (byId.get(id)?.slug as string) ?? null,
         count,
      }));
   }

   // --- moderation ----------------------------------------------------------
   const pendingRows = (pendingRes.data ?? []) as { created_at: string }[];
   const oldestPendingDays = pendingRows.length
      ? Math.floor((Date.now() - new Date(pendingRows[0].created_at).getTime()) / DAY_MS)
      : null;

   // --- listing quality -----------------------------------------------------
   const published = (publishedRes.data ?? []) as { id: string; title: string; description: string | null }[];
   let noPhotos: { id: string; title: string }[] = [];
   if (published.length > 0) {
      const { data: media } = await supabase
         .from("property_media")
         .select("property_id")
         .in("property_id", published.map((p) => p.id).slice(0, 1000));
      const withMedia = new Set((media ?? []).map((m) => m.property_id as string));
      noPhotos = published.filter((p) => !withMedia.has(p.id)).slice(0, 10).map(({ id, title }) => ({ id, title }));
   }
   const shortDescription = published
      .filter((p) => (p.description ?? "").trim().length < 80)
      .slice(0, 10)
      .map(({ id, title }) => ({ id, title }));

   // --- search index coverage (service role: embeddings are server-only) ----
   let indexed: number | null = null;
   try {
      const service = createServiceClient();
      const { count } = await service.from("property_embeddings").select("property_id", { count: "exact", head: true });
      indexed = count ?? 0;
   } catch {
      indexed = null;
   }

   return {
      windowDays: WINDOW_DAYS,
      searchLogAvailable: !logRes.error,
      searches: {
         total: logs.length,
         aiInterpreted: logs.filter((r) => r.used_ai).length,
         zeroResultShare: logs.length ? logs.filter((r) => r.result_count === 0).length / logs.length : 0,
         topQueries,
         zeroResultQueries,
      },
      demandVsSupply,
      leads: { total: leads.length, byStatus, topListings },
      moderation: { pending: pendingRows.length, oldestPendingDays },
      quality: { noPhotos, shortDescription },
      search: { published: published.length, indexed },
   };
}

// ===========================================================================
// Seller
// ===========================================================================

export interface SellerListingInsight {
   id: string;
   title: string;
   slug: string;
   status: string;
   locality: string | null;
   propertyType: string | null;
   price: number | null;
   leads30d: number;
   leadsTotal: number;
   photos: number;
   /** e.g. "12% above the median of 6 similar plots in Shadnagar" */
   priceBenchmark: string | null;
   checklist: string[];
}

export interface SellerInsightData {
   windowDays: number;
   listings: SellerListingInsight[];
   demand: { locality: string; searches: number }[];
   totals: { leads30d: number; published: number };
}

export async function getSellerInsightData(userId: string): Promise<SellerInsightData> {
   const supabase = await createClient();
   const since = Date.now() - WINDOW_DAYS * DAY_MS;

   const { data: ownRows } = await supabase
      .from("properties")
      .select("id, title, slug, status, locality, property_type, price, area, area_unit, description, project_id")
      .eq("owner_id", userId)
      .neq("status", "archived")
      .order("created_at", { ascending: false })
      .limit(200);
   const own = (ownRows ?? []) as {
      id: string; title: string; slug: string; status: string; locality: string | null; property_type: string | null;
      price: number | string | null; area: number | string | null; area_unit: string | null; description: string | null;
   }[];
   const ids = own.map((p) => p.id);

   const [mediaRes, leadsRes, demandRes] = await Promise.all([
      ids.length ? supabase.from("property_media").select("property_id").in("property_id", ids) : Promise.resolve({ data: [] }),
      // seller_leads (0029) is already scoped to the caller's own listings
      // and carries no buyer contact details.
      supabase.from("seller_leads").select("property_id, created_at").limit(5000),
      supabase.rpc("seller_search_demand", { p_days: WINDOW_DAYS }),
   ]);

   const photosBy = new Map<string, number>();
   for (const m of (mediaRes.data ?? []) as { property_id: string }[]) photosBy.set(m.property_id, (photosBy.get(m.property_id) ?? 0) + 1);

   const leadRows = (leadsRes.data ?? []) as { property_id: string | null; created_at: string }[];
   const leadsTotal = new Map<string, number>();
   const leads30 = new Map<string, number>();
   for (const l of leadRows) {
      if (!l.property_id) continue;
      leadsTotal.set(l.property_id, (leadsTotal.get(l.property_id) ?? 0) + 1);
      if (new Date(l.created_at).getTime() >= since) leads30.set(l.property_id, (leads30.get(l.property_id) ?? 0) + 1);
   }

   // Price benchmark: median price per unit area of other public listings
   // of the same type, in the same locality, measured in the same unit.
   const localities = [...new Set(own.map((p) => p.locality).filter((l): l is string => Boolean(l)))];
   const comparables = localities.length
      ? (((await supabase
           .from("property_public")
           .select("id, locality, property_type, price, area, area_unit")
           .in("locality", localities.slice(0, 50))
           .is("project_id", null)
           .eq("listing_type", "sale")
           .limit(2000)).data ?? []) as { id: string; locality: string; property_type: string; price: number | string; area: number | string | null; area_unit: string | null }[])
      : [];

   const benchmarkFor = (p: (typeof own)[number]): string | null => {
      const price = Number(p.price);
      const area = Number(p.area);
      if (!p.locality || !p.property_type || !(price > 0) || !(area > 0)) return null;
      const peers = comparables.filter(
         (c) =>
            c.id !== p.id &&
            c.locality.toLowerCase() === p.locality!.toLowerCase() &&
            c.property_type.toLowerCase() === p.property_type!.toLowerCase() &&
            (c.area_unit ?? "") === (p.area_unit ?? "") &&
            Number(c.area) > 0 &&
            Number(c.price) > 0,
      );
      if (peers.length < 3) return null; // too few to be meaningful
      const m = median(peers.map((c) => Number(c.price) / Number(c.area)));
      if (!m) return null;
      const diff = (price / area - m) / m;
      const pct = Math.round(Math.abs(diff) * 100);
      const unit = p.area_unit ?? "unit";
      const where = `${peers.length} similar ${p.property_type.toLowerCase()} listings in ${p.locality}`;
      if (pct < 5) return `In line with the median of ${where} (${formatINR(Math.round(m))}/${unit})`;
      return `${pct}% ${diff > 0 ? "above" : "below"} the median of ${where} (${formatINR(Math.round(m))}/${unit})`;
   };

   const listings: SellerListingInsight[] = own.map((p) => {
      const photos = photosBy.get(p.id) ?? 0;
      const checklist: string[] = [];
      if (p.status === "draft") checklist.push("Still a draft — submit it for review so buyers can see it.");
      if (p.status === "rejected") checklist.push("Rejected by the admin — see the reason on the listing and resubmit.");
      if (photos === 0) checklist.push("Add photos — listings without photos get far fewer enquiries.");
      else if (photos < 4) checklist.push(`Only ${photos} photo${photos === 1 ? "" : "s"}; aim for at least 4 (front, plot/rooms, road access, surroundings).`);
      if ((p.description ?? "").trim().length < 150) checklist.push("Expand the description: facing, road width, approvals, distance to landmarks.");
      if (!(Number(p.area) > 0)) checklist.push("Add the area so buyers can compare price per unit.");
      return {
         id: p.id,
         title: p.title,
         slug: p.slug,
         status: p.status,
         locality: p.locality,
         propertyType: p.property_type,
         price: Number(p.price) > 0 ? Number(p.price) : null,
         leads30d: leads30.get(p.id) ?? 0,
         leadsTotal: leadsTotal.get(p.id) ?? 0,
         photos,
         priceBenchmark: benchmarkFor(p),
         checklist,
      };
   });

   const demand = ((demandRes.data ?? []) as { locality: string; searches: number | string }[]).map((d) => ({
      locality: d.locality,
      searches: Number(d.searches) || 0,
   }));

   return {
      windowDays: WINDOW_DAYS,
      listings,
      demand,
      totals: {
         leads30d: [...leads30.values()].reduce((a, b) => a + b, 0),
         published: own.filter((p) => p.status === "published").length,
      },
   };
}
