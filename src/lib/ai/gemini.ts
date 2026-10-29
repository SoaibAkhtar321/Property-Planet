// src/lib/ai/gemini.ts
//
// Minimal server-side client for the Google Gemini API (REST, no SDK).
//
// SERVER ONLY. GEMINI_API_KEY must never be prefixed NEXT_PUBLIC_ or
// imported from a "use client" file. Every function here fails soft:
// with no key configured, or when Gemini errors or times out, callers get
// `null` and fall back to the non-AI path, so the site never breaks
// because the AI provider is unavailable.
//
// Models are configurable so the client can be moved to a newer model
// without a code change:
//   GEMINI_MODEL        text model  (default: gemini-3.5-flash-lite)
//   GEMINI_EMBED_MODEL  embeddings  (default: gemini-embedding-2, 768 dims)

if (typeof window !== "undefined") {
   throw new Error("src/lib/ai/gemini.ts is server-only and must not be imported in the browser.");
}

const API_BASE = "https://generativelanguage.googleapis.com/v1beta";
const DEFAULT_TEXT_MODEL = "gemini-3.5-flash-lite";
const DEFAULT_EMBED_MODEL = "gemini-embedding-2";
const REQUEST_TIMEOUT_MS = 8000;

/** Must match property_embeddings.embedding's vector(768) (0038). */
export const EMBEDDING_DIMENSIONS = 768;

export const textModel = () => process.env.GEMINI_MODEL?.trim() || DEFAULT_TEXT_MODEL;
export const embedModel = () => process.env.GEMINI_EMBED_MODEL?.trim() || DEFAULT_EMBED_MODEL;

export function isAIEnabled(): boolean {
   return Boolean(process.env.GEMINI_API_KEY?.trim());
}

async function callGemini(path: string, body: unknown, timeoutMs = REQUEST_TIMEOUT_MS): Promise<any | null> {
   const key = process.env.GEMINI_API_KEY?.trim();
   if (!key) return null;

   const controller = new AbortController();
   const timer = setTimeout(() => controller.abort(), timeoutMs);
   try {
      const res = await fetch(`${API_BASE}/${path}`, {
         method: "POST",
         headers: { "Content-Type": "application/json", "x-goog-api-key": key },
         body: JSON.stringify(body),
         signal: controller.signal,
         cache: "no-store",
      });
      if (!res.ok) {
         // Never log the key or the request body (it may contain user text).
         console.error(`Gemini ${path.split(":").pop()} failed: HTTP ${res.status}`);
         return null;
      }
      return await res.json();
   } catch (err) {
      const reason = err instanceof Error && err.name === "AbortError" ? "timeout" : "network error";
      console.error(`Gemini ${path.split(":").pop()} failed: ${reason}`);
      return null;
   } finally {
      clearTimeout(timer);
   }
}

// ---------------------------------------------------------------------------
// Embeddings
// ---------------------------------------------------------------------------

/**
 * gemini-embedding-2 takes the task as a text prefix instead of a
 * task_type field: queries and documents are embedded asymmetrically.
 */
function embeddingInput(text: string, kind: "query" | "document", title?: string): string {
   const clean = text.replace(/\s+/g, " ").trim().slice(0, 6000);
   if (kind === "query") return `task: search result | query: ${clean}`;
   return `title: ${(title ?? "none").replace(/\s+/g, " ").trim()} | text: ${clean}`;
}

function toVector(values: unknown): number[] | null {
   if (!Array.isArray(values) || values.length !== EMBEDDING_DIMENSIONS) return null;
   if (!values.every((v) => typeof v === "number" && Number.isFinite(v))) return null;
   return values as number[];
}

export async function embedText(text: string, kind: "query" | "document", title?: string): Promise<number[] | null> {
   const model = embedModel();
   const json = await callGemini(`models/${model}:embedContent`, {
      model: `models/${model}`,
      content: { parts: [{ text: embeddingInput(text, kind, title) }] },
      output_dimensionality: EMBEDDING_DIMENSIONS,
   });
   return toVector(json?.embedding?.values);
}

/** Embeds up to 100 documents in one request. Result order matches input; failures are null. */
export async function embedDocuments(docs: { title: string; text: string }[]): Promise<(number[] | null)[]> {
   if (docs.length === 0) return [];
   const model = embedModel();
   const json = await callGemini(
      `models/${model}:batchEmbedContents`,
      {
         requests: docs.slice(0, 100).map((d) => ({
            model: `models/${model}`,
            content: { parts: [{ text: embeddingInput(d.text, "document", d.title) }] },
            output_dimensionality: EMBEDDING_DIMENSIONS,
         })),
      },
      20000,
   );
   const list: unknown[] = Array.isArray(json?.embeddings) ? json.embeddings : [];
   return docs.map((_, i) => toVector((list[i] as any)?.values));
}

/** pgvector text literal for an RPC argument, e.g. "[0.1,0.2,...]". */
export const toPgVector = (v: number[]) => `[${v.join(",")}]`;

// ---------------------------------------------------------------------------
// Text generation
// ---------------------------------------------------------------------------

function extractText(json: any): string | null {
   const parts = json?.candidates?.[0]?.content?.parts;
   if (!Array.isArray(parts)) return null;
   const text = parts.map((p: any) => (typeof p?.text === "string" ? p.text : "")).join("");
   return text.trim() || null;
}

/**
 * Generates JSON matching `schema` (an OpenAPI-style schema as used by the
 * Gemini API's responseSchema). Returns the parsed object, or null on any
 * failure. Callers must still validate fields — the model is untrusted.
 */
export async function generateJson<T = unknown>(
   systemInstruction: string,
   prompt: string,
   schema: Record<string, unknown>,
   opts: { temperature?: number; maxOutputTokens?: number; timeoutMs?: number } = {},
): Promise<T | null> {
   const model = textModel();
   const json = await callGemini(
      `models/${model}:generateContent`,
      {
         systemInstruction: { parts: [{ text: systemInstruction }] },
         contents: [{ role: "user", parts: [{ text: prompt }] }],
         generationConfig: {
            temperature: opts.temperature ?? 0,
            maxOutputTokens: opts.maxOutputTokens ?? 1024,
            responseMimeType: "application/json",
            responseSchema: schema,
         },
      },
      opts.timeoutMs,
   );
   const text = extractText(json);
   if (!text) return null;
   try {
      return JSON.parse(text) as T;
   } catch {
      // Some models wrap JSON in a code fence despite responseMimeType.
      const fenced = text.match(/\{[\s\S]*\}/);
      if (!fenced) return null;
      try {
         return JSON.parse(fenced[0]) as T;
      } catch {
         return null;
      }
   }
}
