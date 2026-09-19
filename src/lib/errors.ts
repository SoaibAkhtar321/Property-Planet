// src/lib/errors.ts
//
// Turns a Supabase/Postgres/Storage error into a message that is safe and
// useful to show a seller or buyer. The raw error is logged (visible in server
// logs / the browser console) but never returned to the UI: it can contain
// table, column and policy names, or SQL detail.
//
// Only broad, well-known failure classes are mapped; anything else falls back
// to the caller's own plain-language message.

interface ErrorLike {
   code?: string;
   message?: string;
   statusCode?: string | number;
}

export function friendlyError(error: unknown, fallback: string, context?: string): string {
   // eslint-disable-next-line no-console
   console.error(context ? `[${context}]` : "[error]", error);

   const e = (error ?? {}) as ErrorLike;
   const message = (e.message ?? "").toLowerCase();

   if (e.code === "23505") return "That already exists. Please use a different value.";
   if (e.code === "23503") return "This item is linked to something that no longer exists. Please refresh and try again.";
   if (e.code === "42501" || message.includes("row-level security") || message.includes("row level security")) {
      return "You don't have permission to do that.";
   }
   if (message.includes("failed to fetch") || message.includes("network") || message.includes("timeout")) {
      return "We couldn't reach the server. Please check your connection and try again.";
   }
   if (message.includes("payload too large") || message.includes("exceeded the maximum allowed size")) {
      return "That file is too large.";
   }
   if (message.includes("mime type") || message.includes("not supported")) {
      return "That file type isn't supported.";
   }
   return fallback;
}
