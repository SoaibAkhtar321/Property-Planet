// src/lib/supabase/middleware.ts
//
// Middleware-safe Supabase client, following @supabase/ssr's documented
// middleware pattern. Distinct from client.ts (browser) and server.ts
// (Server Components/Actions/Route Handlers) because middleware has its
// own cookie API: reads come from the incoming NextRequest, and any
// refreshed session cookies must be written onto a NextResponse that is
// then returned and used as the actual response for the request.
//
// IMPORTANT cookie-refresh detail: when Supabase's client needs to write
// updated cookies (e.g. a refreshed access token), we mirror them onto
// `request.cookies` too and rebuild `response` from that mutated request.
// Skipping this step is a common source of "logged in but the very next
// request still sees the stale/expired cookie" bugs, since without it the
// refreshed cookie would only ever reach the browser, never this
// in-flight request's downstream server code.

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

interface CookieToSet {
   name: string;
   value: string;
   options: CookieOptions;
}

export function createMiddlewareClient(request: NextRequest) {
   let response = NextResponse.next({ request: { headers: request.headers } });

   const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
   const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

   if (!url || !anonKey) {
      throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.");
   }

   const supabase = createServerClient(url, anonKey, {
      cookies: {
         getAll() {
            return request.cookies.getAll();
         },
         setAll(cookiesToSet: CookieToSet[]) {
            // 1. Reflect the new cookies onto the request so anything
            //    reading `request.cookies` later in this same pass sees
            //    the fresh values.
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
            // 2. Rebuild the response from that updated request, then
            //    write the same cookies onto it so the browser receives
            //    the refreshed session.
            response = NextResponse.next({ request: { headers: request.headers } });
            cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
         },
      },
   });

   return { supabase, response };
}