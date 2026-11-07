// fetch wrapper for every server-side Supabase call.
//
// If the database is unreachable (e.g. the Supabase project is paused),
// each request used to take ~7 s to fail, one after another, so /properties
// sat on "Loading properties…" for 14 s+ and could hit the host's function
// time limit. Two guards keep pages fast:
//  * a hard per-request cap (Promise.race, so it holds even while DNS is
//    still resolving), and
//  * a short circuit breaker: after a network failure, further calls fail
//    instantly for a little while instead of waiting again.
// Failures are returned as an HTTP 504 response rather than thrown: the
// Supabase client retries thrown network errors three times with 1 s/2 s/4 s
// back-off (that was the 7 s per query), but does not retry a 504.
// Pages then render their normal empty states right away.
export const SUPABASE_TIMEOUT_MS = 4000;
const BREAKER_MS = 30_000;

let downUntil = 0;

export const timeoutFetch: typeof fetch = async (input, init) => {
   if (Date.now() < downUntil) return unavailable("Supabase unreachable");
   const controller = new AbortController();
   const outer = init?.signal;
   if (outer) {
      if (outer.aborted) controller.abort(outer.reason);
      else outer.addEventListener("abort", () => controller.abort(outer.reason), { once: true });
   }
   let timer: ReturnType<typeof setTimeout> | undefined;
   const deadline = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
         controller.abort();
         reject(new TypeError("fetch failed (Supabase request timed out)"));
      }, SUPABASE_TIMEOUT_MS);
   });
   try {
      return await Promise.race([fetch(input, { ...init, signal: controller.signal }), deadline]);
   } catch (err) {
      if (outer?.aborted) throw err;
      downUntil = Date.now() + BREAKER_MS;
      return unavailable(err instanceof Error ? err.message : "fetch failed");
   } finally {
      clearTimeout(timer);
   }
};

function unavailable(message: string): Response {
   return new Response(JSON.stringify({ message, code: "UNAVAILABLE", details: null, hint: null }), {
      status: 504,
      headers: { "content-type": "application/json" },
   });
}
