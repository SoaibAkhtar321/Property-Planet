// src/lib/ai/insightQueries.ts
//
// Reads the cached AI summary for the current admin/seller through the
// caller's RLS client (0038: admins read scope 'admin', sellers read only
// their own row).

import { createClient } from "@/lib/supabase/server";
import type { InsightSummary } from "./insightActions";

export interface CachedInsight {
   summary: InsightSummary;
   createdAt: string;
}

export async function getCachedInsight(scope: "admin" | "seller", subjectId: string): Promise<CachedInsight | null> {
   const supabase = await createClient();
   const { data, error } = await supabase
      .from("ai_insight_cache")
      .select("payload, created_at")
      .eq("scope", scope)
      .eq("subject_id", subjectId)
      .maybeSingle();
   if (error || !data) return null;
   const payload = data.payload as InsightSummary;
   if (!payload?.headline || !Array.isArray(payload.insights)) return null;
   return { summary: payload, createdAt: data.created_at as string };
}
