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
   // Database triggers/functions guard admin-only and immutable fields with
   // plain `raise exception` text (e.g. "only admins can change roles",
   // "published_at cannot be set directly"). Those are internal rule names,
   // not something to show as-is.
   if (message.includes("only admins") || message.includes("by an admin") || message.includes("not authorized")) {
      return "You don't have permission to do that.";
   }
   if (message.includes("not authenticated") || message.includes("jwt expired")) {
      return "Your session has expired. Please sign in again.";
   }
   if (e.code === "22P02" || e.code === "23502" || e.code === "23514" || e.code === "22001") {
      return "Some of the values entered aren't valid. Please check them and try again.";
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
