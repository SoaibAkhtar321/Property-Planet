// src/lib/ai/embeddings.ts
//
// Keeps property_embeddings (0038) in step with listings.
//
// SERVER ONLY. Uses the service-role client because property_embeddings
// has no client write policy by design. Every caller is a server action
// that has ALREADY authorised the user for the change it just made
// (requireAdmin / owner checks + RLS on the write itself); this module
// only ever derives a vector from that same row.
//
// The embedded text is built from PUBLIC listing fields only. The exact
// address and exact coordinates are never read here, so semantic search
// can't be used to probe a listing's hidden location.

import { createHash } from "node:crypto";
import { after } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { embedDocuments, embedModel, isAIEnabled, toPgVector } from "./gemini";

interface EmbeddableRow {
   id: string;
   title: string;
   property_type: string | null;
   price: number | string | null;
   price_unit_label: string | null;
   area: number | string | null;
   area_unit: string | null;
   bedrooms: number | null;
   bathrooms: number | null;
   description: string | null;
   city: string | null;
   locality: string | null;
   status: string;
   property_location: { area: string | null; nearby_landmarks: string | null } | { area: string | null; nearby_landmarks: string | null }[] | null;
}

const SELECT =
   "id, title, property_type, price, price_unit_label, area, area_unit, bedrooms, bathrooms, description, city, locality, status, property_location(area, nearby_landmarks)";

function formatRupees(value: number): string {
   if (value >= 10_000_000) return `${+(value / 10_000_000).toFixed(2)} crore`;
   if (value >= 100_000) return `${+(value / 100_000).toFixed(1)} lakh`;
   return `${value} rupees`;
}

/** The listing as one paragraph of searchable text (public fields only). */
export function buildPropertyDocument(row: EmbeddableRow): { title: string; text: string } {
   const loc = Array.isArray(row.property_location) ? row.property_location[0] : row.property_location;
   const price = Number(row.price);
   const area = Number(row.area);
   const parts = [
      row.property_type ? `${row.property_type} for sale` : "Property for sale",
      [loc?.area, row.locality, row.city].filter(Boolean).join(", ") && `in ${[loc?.area, row.locality, row.city].filter(Boolean).join(", ")}`,
      Number.isFinite(price) && price > 0 && `priced at ${formatRupees(price)}${row.price_unit_label ? ` ${row.price_unit_label}` : ""}`,
      Number.isFinite(area) && area > 0 && `area ${area} ${row.area_unit ?? ""}`.trim(),
      row.bedrooms ? `${row.bedrooms} bedrooms (${row.bedrooms} BHK)` : null,
      row.bathrooms ? `${row.bathrooms} bathrooms` : null,
      loc?.nearby_landmarks ? `nearby: ${loc.nearby_landmarks}` : null,
      row.description,
   ];
   return { title: row.title, text: parts.filter(Boolean).join(". ") };
}

const hashOf = (doc: { title: string; text: string }) =>
   createHash("sha256").update(`${embedModel()}\n${doc.title}\n${doc.text}`).digest("hex");

/**
 * Re-embeds one listing if it's published and its searchable text changed.
 * Fire-and-forget safe: never throws, returns what it did.
 */
export async function syncPropertyEmbedding(propertyId: string): Promise<"embedded" | "unchanged" | "skipped" | "failed"> {
   if (!isAIEnabled()) return "skipped";
   try {
      const service = createServiceClient();
      const { data: row, error } = await service.from("properties").select(SELECT).eq("id", propertyId).maybeSingle();
      if (error || !row) return "failed";
      if ((row as EmbeddableRow).status !== "published") return "skipped";

      const doc = buildPropertyDocument(row as EmbeddableRow);
      const hash = hashOf(doc);
      const { data: existing } = await service
         .from("property_embeddings")
         .select("content_hash")
         .eq("property_id", propertyId)
         .maybeSingle();
      if (existing?.content_hash === hash) return "unchanged";

      const [vector] = await embedDocuments([doc]);
      if (!vector) return "failed";

      const { error: upsertError } = await service.from("property_embeddings").upsert({
         property_id: propertyId,
         embedding: toPgVector(vector),
         content_hash: hash,
         model: embedModel(),
         updated_at: new Date().toISOString(),
      });
      if (upsertError) {
         console.error("Failed to store property embedding:", upsertError.message);
         return "failed";
      }
      return "embedded";
   } catch (err) {
      console.error("syncPropertyEmbedding failed:", err instanceof Error ? err.message : err);
      return "failed";
   }
}

export interface ReindexResult {
   published: number;
   embedded: number;
   unchanged: number;
   failed: number;
}

/**
 * Embeds every published listing that is missing or stale, in batches of
 * 50. Caller must be an authorised admin (see reindexPropertyEmbeddings).
 */
export async function reindexAllPublishedProperties(): Promise<ReindexResult> {
   const result: ReindexResult = { published: 0, embedded: 0, unchanged: 0, failed: 0 };
   if (!isAIEnabled()) return result;

   const service = createServiceClient();
   const { data: rows, error } = await service.from("properties").select(SELECT).eq("status", "published").limit(5000);
   if (error || !rows) {
      if (error) console.error("Reindex: failed to load properties:", error.message);
      return result;
   }
   result.published = rows.length;

   const { data: existingRows } = await service.from("property_embeddings").select("property_id, content_hash").limit(5000);
   const existing = new Map((existingRows ?? []).map((r) => [r.property_id as string, r.content_hash as string]));

   const pending: { id: string; doc: { title: string; text: string }; hash: string }[] = [];
   for (const row of rows as EmbeddableRow[]) {
      const doc = buildPropertyDocument(row);
      const hash = hashOf(doc);
      if (existing.get(row.id) === hash) result.unchanged += 1;
      else pending.push({ id: row.id, doc, hash });
   }

   for (let i = 0; i < pending.length; i += 50) {
      const batch = pending.slice(i, i + 50);
      const vectors = await embedDocuments(batch.map((p) => p.doc));
      const upserts = batch
         .map((p, j) => (vectors[j] ? { property_id: p.id, embedding: toPgVector(vectors[j]!), content_hash: p.hash, model: embedModel(), updated_at: new Date().toISOString() } : null))
         .filter((u): u is NonNullable<typeof u> => u !== null);
      result.failed += batch.length - upserts.length;
      if (upserts.length > 0) {
         const { error: upsertError } = await service.from("property_embeddings").upsert(upserts);
         if (upsertError) {
            console.error("Reindex: failed to store batch:", upsertError.message);
            result.failed += upserts.length;
         } else {
            result.embedded += upserts.length;
         }
      }
   }
   return result;
}

/**
 * Queue a re-embed to run after the current response is sent, so saving a
 * listing is never slowed down (or failed) by the AI provider. Call only
 * from a server action that has already authorised the change.
 */
export function scheduleEmbeddingSync(propertyId: string) {
   if (!isAIEnabled() || !propertyId) return;
   try {
      after(async () => {
         await syncPropertyEmbedding(propertyId);
      });
   } catch {
      // Outside a request scope (scripts): run it directly instead.
      void syncPropertyEmbedding(propertyId);
   }
}
