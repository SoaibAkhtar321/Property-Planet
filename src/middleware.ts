// src/middleware.ts
//
// Phase 6a: centralized, request-level protection for /admin/**.
// Phase 1: extended to also centrally protect /dashboard/** the same way,
// instead of adding a second, separate gating mechanism.
//
// This is a first-line gate, not the only line. Layered protection stays
// exactly as it was for /admin, and follows the same pattern for /dashboard:
//   1. THIS middleware      — blocks the request before any admin/dashboard
//                              page renders.
//   2. requireAdmin() /       — still called in src/app/admin/layout.tsx
//      requireDashboardUser()/  (unchanged) and, new in Phase 1,
//      requireRole()            src/app/dashboard/layout.tsx +
//                                the seller-only pages (src/lib/auth/session.ts).
//                                Kept as defense-in-depth: server actions
//                                and page-level checks are directly
//                                callable/renderable independent of this
//                                middleware's matcher, so they must keep
//                                checking for themselves.
//   3. Supabase RLS         — the final, database-level backstop. Even if
//                              both of the above were somehow bypassed,
//                              RLS policies from 0001_profiles.sql /
//                              0006_projects.sql still refuse the
//                              write/read.
//
// Never trusts a client-supplied role or localStorage — role is
// re-derived server-side from `profiles.role` via the authenticated
// user's id, exactly like requireAdmin() and every RLS policy do.

import { NextResponse, type NextRequest } from "next/server";
import { createMiddlewareClient } from "@/lib/supabase/middleware";

// Dashboard sub-paths that require the `seller` role specifically. Buyers
// (and any other non-seller role) are redirected to their own dashboard
// home rather than blocked outright — they *are* legitimately logged in,
// just not authorized for this particular page.
const SELLER_ONLY_DASHBOARD_PATHS = ["/dashboard/add-property", "/dashboard/properties-list"];

export async function middleware(request: NextRequest) {
   const { pathname } = request.nextUrl;
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

   if (pathname.startsWith("/admin")) {
      if (error || !profile || profile.role !== "admin") {
         // Authenticated but not an admin.
         return NextResponse.redirect(new URL("/", request.url));
      }
      // Admin — allow through. `response` (not a fresh NextResponse.next())
      // is returned so any session cookies Supabase refreshed above are
      // preserved on the way out.
      return response;
   }

   // pathname.startsWith("/dashboard") — the only other matched prefix.
   if (error || !profile) {
      // No readable profile row: fail closed, same as the admin branch —
      // never an elevated or default-access fallback.
      return NextResponse.redirect(new URL("/", request.url));
   }

   const isSellerOnlyPath = SELLER_ONLY_DASHBOARD_PATHS.some(
      (path) => pathname === path || pathname.startsWith(`${path}/`)
   );

   if (isSellerOnlyPath && profile.role !== "seller") {
      return NextResponse.redirect(new URL("/dashboard/dashboard-index", request.url));
   }

   return response;
}

export const config = {
   // Scoped to /admin/** and /dashboard/** only. Deliberately does NOT
   // match "/", "/login", public /properties or /projects pages, static
   // assets, or _next internals — so a redirect to "/" can never re-enter
   // this middleware and loop.
   matcher: ["/admin/:path*", "/dashboard/:path*"],
};
