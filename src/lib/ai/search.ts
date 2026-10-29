// src/lib/ai/search.ts
//
// The AI search layer behind /properties?q=...
//
//   1. interpretSearch() turns the text into structured filters (validated
//      against real facet values).
//   2. When embeddings are available, match_published_properties() (0038)
//      ranks published listings by meaning; the structured filters are
//      then applied on top and results keep relevance order.
//   3. Without a key / before the migration is deployed / before listings
//      are indexed, it falls back to the existing keyword search using the
//      interpreted filters — so the page always returns something sensible.
//   4. If the AI's price/BHK reading leaves zero results, those two limits
//      are relaxed once and the page says so.
//
// Filters the user set explicitly in the filter panel always override the
// AI's reading of the text.

import { after } from "next/server";
import { headers } from "next/headers";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import {
   searchPublishedProperties,
   type PropertySearchParams,
   type PropertySearchResult,
} from "@/lib/properties/queries";
import { formatINR } from "@/utils/propertyPlanetAIEngine";
import { embedText, isAIEnabled, toPgVector } from "./gemini";
import { interpretSearch, type SearchFacetsInput, type SearchInterpretation } from "./searchInterpreter";

export interface AiSearchInfo {
   /** Human-readable pieces of what the search understood, for display. */
   chips: string[];
   /** "semantic" when results are ranked by meaning, "keyword" otherwise. */
   mode: "semantic" | "keyword";
   /** True when the AI's price/BHK limits were dropped to avoid an empty page. */
   relaxed: boolean;
   /** True when Gemini (not just the rule parser) read the query. */
   aiPowered: boolean;
}

const SEMANTIC_MATCH_COUNT = 120;
// gemini-embedding cosine similarity for a genuinely related listing sits
// well above this; it mainly cuts unrelated noise from tiny inventories.
const SEMANTIC_MIN_SIMILARITY = 0.3;

// Cost guard: at most AI_RATE_LIMIT Gemini-backed searches per visitor IP
// per minute. Over the limit, search still works — it just uses the rule
// parser and keyword match. In-memory, so per server instance: it stops a
// runaway bot, it is not a global quota (set a budget alert in Google AI
// Studio for that).
const AI_RATE_LIMIT = 30;
const AI_RATE_WINDOW_MS = 60_000;
const aiHits = new Map<string, number[]>();

async function withinAiBudget(): Promise<boolean> {
   const h = await headers();
   const ip = (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || h.get("x-real-ip") || "unknown";
   const now = Date.now();
   const recent = (aiHits.get(ip) ?? []).filter((t) => now - t < AI_RATE_WINDOW_MS);
   if (recent.length >= AI_RATE_LIMIT) {
      aiHits.set(ip, recent);
      return false;
   }
   recent.push(now);
   aiHits.set(ip, recent);
   if (aiHits.size > 5000) {
      for (const [key, times] of aiHits) if (times.every((t) => now - t >= AI_RATE_WINDOW_MS)) aiHits.delete(key);
   }
   return true;
}

async function semanticIds(query: string, useAi: boolean): Promise<string[] | null> {
   if (!useAi || !isAIEnabled()) return null;
   const vector = await embedText(query, "query");
   if (!vector) return null;
   const supabase = await createClient();
   const { data, error } = await supabase.rpc("match_published_properties", {
      p_query_embedding: toPgVector(vector),
      p_match_count: SEMANTIC_MATCH_COUNT,
      p_min_similarity: SEMANTIC_MIN_SIMILARITY,
   });
   if (error) {
      // Most likely 0038 isn't deployed yet — keyword search still works.
      console.error("Semantic search unavailable:", error.message);
      return null;
   }
   const ids = ((data ?? []) as { property_id: string }[]).map((r) => r.property_id);
   // An empty index (nothing embedded yet) shouldn't hide every listing.
   return ids.length > 0 ? ids : null;
}

function buildChips(i: SearchInterpretation, applied: PropertySearchParams): string[] {
   const chips: string[] = [];
   if (applied.propertyType) chips.push(applied.propertyType);
   if (applied.minBedrooms) chips.push(`${applied.minBedrooms}+ BHK`);
   const place = applied.locality || applied.city;
   if (place) chips.push(`in ${place}`);
   if (applied.minPrice && applied.maxPrice) chips.push(`${formatINR(applied.minPrice)} – ${formatINR(applied.maxPrice)}`);
   else if (applied.maxPrice) chips.push(`under ${formatINR(applied.maxPrice)}`);
   else if (applied.minPrice) chips.push(`above ${formatINR(applied.minPrice)}`);
   if (i.keywords) chips.push(`“${i.keywords}”`);
   return chips;
}

function logSearch(query: string, interpretation: SearchInterpretation, resultCount: number, usedAi: boolean) {
   const trimmed = query.replace(/\s+/g, " ").trim().slice(0, 200);
   if (!trimmed) return;
   // After the response is sent; never slows down or breaks the page.
   after(async () => {
      try {
         const service = createServiceClient();
         const { source: _source, ...rest } = interpretation;
         await service.from("property_search_log").insert({
            query: trimmed,
            interpreted: rest,
            result_count: resultCount,
            used_ai: usedAi,
         });
      } catch {
         // Missing service key or 0038 not deployed: insights just stay empty.
      }
   });
}

/**
 * Runs an AI-assisted search. `params` carries the explicit filters from
 * the URL; `rawQuery` is the free text the visitor typed.
 */
export async function aiSearchProperties(
   params: PropertySearchParams,
   rawQuery: string,
   facets: SearchFacetsInput,
): Promise<{ result: PropertySearchResult; info: AiSearchInfo }> {
   // Interpretation and embedding are independent Gemini calls: run them
   // side by side so an AI search costs one round-trip of latency, not two.
   const useAi = await withinAiBudget();
   const [interpretation, ids] = await Promise.all([
      interpretSearch(rawQuery, facets, { useAi }),
      semanticIds(rawQuery, useAi),
   ]);

   // Explicit panel filters win over the AI's reading of the text.
   const applied: PropertySearchParams = {
      ...params,
      q: undefined,
      propertyType: params.propertyType || interpretation.propertyType,
      city: params.city || (params.locality ? undefined : interpretation.city),
      locality: params.locality || interpretation.locality,
      minPrice: params.minPrice ?? interpretation.minPrice,
      maxPrice: params.maxPrice ?? interpretation.maxPrice,
      minBedrooms: interpretation.minBedrooms,
   };

   const extractedSomething = Boolean(
      interpretation.propertyType || interpretation.city || interpretation.locality ||
         interpretation.minPrice || interpretation.maxPrice || interpretation.minBedrooms,
   );
   const keywordParams: PropertySearchParams = {
      ...applied,
      // Only the leftover words are matched literally once structure is pulled out.
      q: extractedSomething ? interpretation.keywords || undefined : rawQuery,
   };

   let mode: AiSearchInfo["mode"] = ids ? "semantic" : "keyword";
   const run = (p: PropertySearchParams) =>
      mode === "semantic" ? searchPublishedProperties({ ...p, q: undefined, restrictToIds: ids!, rankByIds: true }) : searchPublishedProperties(p);

   let result = await run(mode === "semantic" ? applied : keywordParams);

   // Semantic matches all filtered out → try the keyword path once.
   if (result.total === 0 && mode === "semantic") {
      mode = "keyword";
      result = await searchPublishedProperties(keywordParams);
   }

   // Still nothing, and the AI added price/BHK limits the user didn't set:
   // drop those once rather than show an empty page.
   let relaxed = false;
   const aiAddedLimits =
      (params.minPrice === undefined && interpretation.minPrice !== undefined) ||
      (params.maxPrice === undefined && interpretation.maxPrice !== undefined) ||
      interpretation.minBedrooms !== undefined;
   if (result.total === 0 && aiAddedLimits) {
      const loosened: PropertySearchParams = {
         ...keywordParams,
         minPrice: params.minPrice,
         maxPrice: params.maxPrice,
         minBedrooms: undefined,
      };
      const retry = await searchPublishedProperties(loosened);
      if (retry.total > 0) {
         result = retry;
         relaxed = true;
      }
   }

   logSearch(rawQuery, interpretation, result.total, interpretation.source === "ai");

   return {
      result,
      info: {
         chips: buildChips(interpretation, relaxed ? { ...applied, minPrice: params.minPrice, maxPrice: params.maxPrice, minBedrooms: undefined } : applied),
         mode,
         relaxed,
         aiPowered: interpretation.source === "ai",
      },
   };
}

/** Logs a plain (non-AI) search too, so demand insights cover every search. */
export function logPlainSearch(query: string, resultCount: number) {
   logSearch(query, { keywords: query, source: "rules" }, resultCount, false);
}
