// src/middleware.ts
//
// Phase 6a: centralized, request-level protection for /admin/**.
//
// This is a first-line gate, not the only line. Layered protection stays
// exactly as it was:
//   1. THIS middleware      — blocks the request before any admin page
//                              renders (new in Phase 6a).
//   2. requireAdmin()       — still called in src/app/admin/layout.tsx and
//      (lib/admin/auth.ts)    individually inside every admin server action
//                              in src/lib/admin/projects/actions.ts. Kept
//                              as-is: server actions are directly callable
//                              endpoints that this middleware's matcher
//                              does not cover on its own, so they must
//                              keep checking for themselves.
//   3. Supabase RLS         — the final, database-level backstop. Even if
//                              both of the above were somehow bypassed,
//                              the admin-only RLS policies from
//                              0006_projects.sql (and profiles' role
//                              policies) still refuse the write/read.
//
// Never trusts a client-supplied role or localStorage — role is
// re-derived server-side from `profiles.role` via the authenticated
// user's id, exactly like requireAdmin() and every RLS policy do.

import { NextResponse, type NextRequest } from "next/server";
import { createMiddlewareClient } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
   const { supabase, response } = createMiddlewareClient(request);

   const {
      data: { user },
   } = await supabase.auth.getUser();

   if (!user) {
      // Unauthenticated. There is no standalone /login route in this app
      // (login is the LoginModal component, opened client-side) — see
      // lib/admin/auth.ts for the same choice of redirect target.
      return NextResponse.redirect(new URL("/", request.url));
   }

   const { data: profile, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

   if (error || !profile || profile.role !== "admin") {
      // Authenticated but not an admin.
      return NextResponse.redirect(new URL("/", request.url));
   }

   // Admin — allow through. `response` (not a fresh NextResponse.next())
   // is returned so any session cookies Supabase refreshed above are
   // preserved on the way out.
   return response;
}

export const config = {
   // Scoped to /admin/** only. Deliberately does NOT match "/", "/login",
   // /dashboard/**, public /properties or /projects pages, static assets,
   // or _next internals — so a redirect to "/" can never re-enter this
   // middleware and loop.
   matcher: ["/admin/:path*"],
};