"use server";

// src/lib/admin/properties/actions.ts
//
// Server actions backing the /admin/properties moderation queue. Mirrors
// src/lib/admin/projects/actions.ts's pattern — requireAdmin() first
// (defense-in-depth alongside src/middleware.ts), write through the
// RLS-respecting createClient(), never createServiceClient().
//
// Authorization for the actual write is enforced by "admins can update any
// property" (0002_properties_and_location.sql) — enforce_seller_property_
// update() (0008) exempts admin callers entirely, so these transitions
// (pending -> published, pending -> rejected) are not subject to the
// draft-only seller transition rules. requireAdmin() is the app-level
// check in front of that database-level backstop, not a replacement.
//
// Only `pending` listings are approved/rejected from here, matching the
// moderation queue's scope (see queries.ts) — the mutations themselves
// don't hard-require the existing status to be `pending` beyond what the
// UI already filters to, since an admin correcting a previously-rejected
// listing back to published (or vice versa) is a legitimate admin action,
// not a bug.

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";
import { createClient } from "@/lib/supabase/server";

export interface ActionResult {
   success: boolean;
   error?: string;
}

function revalidatePropertyPaths(id: string) {
   revalidatePath("/admin/properties");
   revalidatePath(`/admin/properties/${id}`);
   revalidatePath("/admin");
   revalidatePath("/properties");
}

/** Approves a property: status -> published. */
export async function approveProperty(id: string): Promise<ActionResult> {
   await requireAdmin();
   const supabase = await createClient();

   const { error } = await supabase
      .from("properties")
      .update({ status: "published", rejection_reason: null })
      .eq("id", id);

   if (error) {
      return { success: false, error: error.message };
   }

   revalidatePropertyPaths(id);
   return { success: true };
}

/** Rejects a property: status -> rejected, with an optional reason recorded for the seller. */
export async function rejectProperty(id: string, reason?: string): Promise<ActionResult> {
   await requireAdmin();
   const supabase = await createClient();

   const trimmedReason = reason?.trim();

   const { error } = await supabase
      .from("properties")
      .update({ status: "rejected", rejection_reason: trimmedReason ? trimmedReason : null })
      .eq("id", id);

   if (error) {
      return { success: false, error: error.message };
   }

   revalidatePropertyPaths(id);
   return { success: true };
}
