// src/lib/admin/auth.ts
//
// Server-only admin guard for Phase 6. Re-derives the caller's role from
// `profiles` via Supabase (RLS-backed), the same way every RLS policy in
// 0006_projects.sql does via current_role_is('admin') — never trusts a
// client-supplied role.
//
// Phase 6a added src/middleware.ts as a centralized, request-level gate in
// front of /admin/**, but this function is kept as-is and still called
// everywhere it was before: from src/app/admin/layout.tsx, and
// individually inside every admin server action in
// src/lib/admin/projects/actions.ts. Server actions are directly callable
// endpoints that the middleware matcher does not cover by itself, so they
// must keep checking for themselves — this is defense-in-depth, not
// redundant.

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export interface AdminSession {
   userId: string;
   email: string | null;
}

/**
 * Verifies the current request is an authenticated admin. Redirects to
 * / (not logged in, or logged in but not admin) otherwise. Call this
 * at the top of every admin page/layout and every admin server action —
 * server actions are directly callable endpoints and are NOT protected
 * just because the page that renders their trigger button is protected.
 */
export async function requireAdmin(): Promise<AdminSession> {
   const supabase = await createClient();

   const {
      data: { user },
   } = await supabase.auth.getUser();

   if (!user) {
      // No standalone /login route exists in this app — login is the
      // LoginModal component, opened client-side (see src/middleware.ts,
      // which redirects unauthenticated /admin/** requests the same way).
      redirect("/");
   }

   const { data: profile, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

   if (error || !profile || profile.role !== "admin") {
      redirect("/");
   }

   return { userId: user.id, email: user.email ?? null };
}