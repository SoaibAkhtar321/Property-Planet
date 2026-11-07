// src/lib/supabase/client.ts
//
// Browser-side Supabase client. Uses only NEXT_PUBLIC_* env vars — this
// file is safe to import from client components ("use client"). It must
// NEVER import the service-role key; see src/lib/supabase/server.ts for
// the privileged variant, which is server-only.

import { createBrowserClient } from "@supabase/ssr";
import { timeoutFetch } from "./timeoutFetch";

export function createClient() {
   const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
   const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

   if (!url || !anonKey) {
      throw new Error(
         "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
         "Copy .env.example to .env.local and fill in your Supabase project values."
      );
   }

   return createBrowserClient(url, anonKey, { global: { fetch: timeoutFetch } });
}