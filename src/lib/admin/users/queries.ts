// src/lib/admin/users/queries.ts
//
// Admin-only user reads for /admin/users. `profiles` (name/phone/role) is
// read through the RLS-respecting createClient(), authorized by "admins
// can read all profiles" (0001_profiles.sql) — the same pattern as every
// other admin query file.
//
// Email is the one exception: it lives on auth.users, not `profiles`, and
// the anon-key client has no privilege to read other users' auth.users
// rows at all (there's no RLS policy that could grant that — auth.users
// isn't exposed to PostgREST). This file is called only from pages already
// behind requireAdmin() (see src/app/admin/users/page.tsx), so — matching
// the documented, narrow use case for createServiceClient() in
// src/lib/supabase/server.ts ("a code path that has already done its own
// authorization check") — it uses the service client's
// auth.admin.listUsers() purely to resolve id -> email for display. No
// other privileged operation is performed with it, and it never bypasses
// the `profiles` RLS reads above, which remain the source of truth for
// role and name.

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";

export type UserRole = "buyer" | "seller" | "admin";

export interface AdminUserRow {
   id: string;
   full_name: string | null;
   phone: string | null;
   email: string | null;
   role: UserRole;
   created_at: string;
}

/** All users (any role), newest first, for the /admin/users list. Caller must already be behind requireAdmin(). */
export async function getAllUsersForAdmin(): Promise<AdminUserRow[]> {
   const supabase = await createClient();

   const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, phone, role, created_at")
      .order("created_at", { ascending: false });

   if (error) {
      console.error("Failed to load users for admin:", error.message);
      return [];
   }

   const profiles = (data ?? []) as Omit<AdminUserRow, "email">[];
   if (profiles.length === 0) return [];

   let emailById = new Map<string, string>();
   try {
      const service = createServiceClient();
      // listUsers() is paginated (default 50/page); this app's user base is
      // small enough at this phase that a single extra page fetch covers
      // it comfortably, but loop defensively rather than assume one page.
      let page = 1;
      for (;;) {
         const { data: pageData, error: listError } = await service.auth.admin.listUsers({ page, perPage: 200 });
         if (listError) {
            console.error("Failed to load auth users for admin email lookup:", listError.message);
            break;
         }
         for (const u of pageData.users) {
            if (u.email) emailById.set(u.id, u.email);
         }
         if (pageData.users.length < 200) break;
         page += 1;
      }
   } catch (err) {
      // Missing SUPABASE_SERVICE_ROLE_KEY or similar config issue — degrade
      // to showing users without email rather than failing the whole page.
      console.error("Service client unavailable for admin user email lookup:", err);
   }

   return profiles.map((p) => ({ ...p, email: emailById.get(p.id) ?? null }));
}
