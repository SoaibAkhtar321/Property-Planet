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
   phone: string | null;
}

/**
 * Returns the authenticated user's id/email/role/phone, or null if there
 * is no session or no matching `profiles` row. Never throws, never trusts
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
      .select("role, phone")
      .eq("id", user.id)
      .maybeSingle();

   if (error || !profile) {
      // Fail closed: an unreadable/missing profile is treated the same as
      // "not authorized", never as an elevated or default-admin fallback.
      return null;
   }

   return {
      userId: user.id,
      email: user.email ?? null,
      role: profile.role as UserRole,
      phone: profile.phone ?? null,
   };
}

/**
 * Gate for any authenticated dashboard page (buyer or seller — not
 * public). Redirects to "/" (same convention as requireAdmin() — there is
 * no standalone /login route, login is the LoginModal) if there is no
 * session or no valid profile.
 *
 * Buyer profile-completion gate: a buyer only ever gets a `profiles` row
 * with a null `phone` immediately after their first Google sign-in (see
 * 0011/0012's handle_new_user() -- Google OAuth never supplies a phone).
 * Every dashboard page and every buyer-only server action funnels through
 * here (requireRole() below calls this first), so this is the single
 * choke point that redirects such a buyer to /auth/complete-profile
 * instead of letting them through to a dashboard page, a buyer-only
 * action like createInquiry(), or anywhere else gated by this function --
 * consistent with src/middleware.ts's first-line check for the same
 * condition on /dashboard/** requests. Sellers/admins are never affected:
 * their `phone` is set at signup (sellers) or by manual admin grant, and
 * this check only ever fires for role === "buyer".
 */
export async function requireDashboardUser(): Promise<AuthContext> {
   const ctx = await getAuthContext();

   if (!ctx) {
      redirect("/");
   }

   if (ctx.role === "buyer" && !ctx.phone) {
      redirect("/auth/complete-profile");
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
