"use server";

// src/lib/admin/users/actions.ts
//
// Server action backing seller-access grants from /admin/users. Calls the
// existing admin_set_user_role(target_user_id, new_role) RPC
// (0005_admin_rpc_and_storage.sql) rather than a raw `update profiles set
// role = ...` — that function is security definer and independently
// re-checks current_role_is('admin') itself, so this is defense-in-depth
// on top of requireAdmin(), not the only gate.
//
// Role scope, deliberately: this action only ever sets role = 'seller'.
// It does not accept an arbitrary role from the caller — granting/
// revoking admin is out of scope for Phase 4 (see project brief section
// 17: "Do not add a public 'make me admin' feature" / admin-to-admin
// promotion remains a deliberate, separate decision). A buyer/seller can
// never reach this action against their own id in a way that matters,
// since the profiles UPDATE policy (0001) already blocks self role
// changes and the RPC re-derives the caller's own role from `profiles`
// independent of anything this function does — but the smaller reason
// this file doesn't expose a generic "setRole" is scope, not just safety.

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";
import { createClient } from "@/lib/supabase/server";

export interface ActionResult {
   success: boolean;
   error?: string;
}

/** Grants seller access to a buyer. Admin-only; target role is always 'seller'. */
export async function grantSellerAccess(targetUserId: string): Promise<ActionResult> {
   await requireAdmin();

   if (!targetUserId || typeof targetUserId !== "string") {
      return { success: false, error: "A user is required." };
   }

   const supabase = await createClient();

   const { error } = await supabase.rpc("admin_set_user_role", {
      target_user_id: targetUserId,
      new_role: "seller",
   });

   if (error) {
      return { success: false, error: error.message };
   }

   revalidatePath("/admin/users");
   revalidatePath("/admin");
   return { success: true };
}
