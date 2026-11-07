// src/lib/supabase/server.ts
//
// Server-side Supabase clients for Next.js App Router (Server Components,
// Route Handlers, Server Actions). Two exports:
//
//  * createClient()       — session-aware, still uses the ANON key + the
//                            caller's cookies. RLS still applies normally.
//                            Use this for anything done "as the logged-in
//                            user" (reading their own leads, etc).
//
//  * createServiceClient() — uses SUPABASE_SERVICE_ROLE_KEY, bypasses RLS
//                            entirely. Server-only, and only for code paths
//                            that have already done their own authorization
//                            check (e.g. an AI tool-calling function that
//                            needs to run a query the caller's RLS wouldn't
//                            allow, after verifying the caller is allowed to
//                            trigger that specific action).
//
// SUPABASE_SERVICE_ROLE_KEY must never be prefixed NEXT_PUBLIC_ and must
// never be imported from client.ts or any "use client" file.

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { timeoutFetch } from "./timeoutFetch";
import { cookies } from "next/headers";

export async function createClient() {
   const cookieStore = await cookies();
   const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
   const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

   if (!url || !anonKey) {
      throw new Error(
         "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY."
      );
   }

   return createServerClient(url, anonKey, {
      global: { fetch: timeoutFetch },
      cookies: {
         getAll() {
            return cookieStore.getAll();
         },
         setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
            try {
               cookiesToSet.forEach(({ name, value, options }) =>
                  cookieStore.set(name, value, options)
               );
            } catch {
               // setAll called from a Server Component (not a Route Handler
               // or Server Action) — safe to ignore if you have middleware
               // refreshing the session, which Phase 2 will add.
            }
         },
      },
   });
}

export function createServiceClient() {
   const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
   const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

   if (!url || !serviceRoleKey) {
      throw new Error(
         "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. " +
         "This client is server-only — never import it from a client component."
      );
   }

   // Not cookie-based on purpose: this client acts with its own privileged
   // identity, not the end user's session.
   return createServerClient(url, serviceRoleKey, {
      global: { fetch: timeoutFetch },
      cookies: { getAll: () => [], setAll: () => {} },
   });
}