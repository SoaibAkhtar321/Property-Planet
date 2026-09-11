// src/lib/auth/session.ts
//
// Phase 1: shared server-side auth/role helpers for /dashboard/**.
// Mirrors the existing src/lib/admin/auth.ts pattern (requireAdmin()) —
// same fail-closed philosophy, same "role always re-derived from
// `profiles`, never trusted from the client" rule.
//
// Used as defense-in-depth alongside src/middleware.ts, exactly like
// requireAdmin() is defense-in-depth alongside the /admin middleware
// branch: middleware is the first-line gate, these are the second line
// for the page/layout itself.

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type UserRole = "buyer" | "seller" | "admin";

export interface AuthContext {
   userId: string;
   email: string | null;
   role: UserRole;
}

/**
 * Returns the authenticated user's id/email/role, or null if there is no
 * session or no matching `profiles` row. Never throws, never trusts
 * anything but the server-side Supabase session + `profiles` table.
 */
export async function getAuthContext(): Promise<AuthContext | null> {
   const supabase = await createClient();

   const {
      data: { user },
   } = await supabase.auth.getUser();

   if (!user) {
      return null;
   }

   const { data: profile, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

   if (error || !profile) {
      // Fail closed: an unreadable/missing profile is treated the same as
      // "not authorized", never as an elevated or default-admin fallback.
      return null;
   }

   return { userId: user.id, email: user.email ?? null, role: profile.role as UserRole };
}

/**
 * Gate for any authenticated dashboard page (buyer or seller — not
 * public). Redirects to "/" (same convention as requireAdmin() — there is
 * no standalone /login route, login is the LoginModal) if there is no
 * session or no valid profile.
 */
export async function requireDashboardUser(): Promise<AuthContext> {
   const ctx = await getAuthContext();

   if (!ctx) {
      redirect("/");
   }

   return ctx;
}

/**
 * Gate for a dashboard page restricted to specific role(s) (e.g.
 * seller-only pages like add-property / properties-list). Authenticated
 * users of the wrong role are redirected to their own dashboard home
 * rather than to "/", since they are legitimately logged in — just not
 * authorized for this specific page.
 */
export async function requireRole(roles: UserRole[]): Promise<AuthContext> {
   const ctx = await requireDashboardUser();

   if (!roles.includes(ctx.role)) {
      redirect("/dashboard/dashboard-index");
   }

   return ctx;
}
