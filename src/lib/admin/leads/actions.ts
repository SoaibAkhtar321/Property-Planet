"use server";

// src/lib/admin/leads/actions.ts
//
// Server actions backing the /admin/leads UI. Mirrors
// src/lib/admin/projects/actions.ts's pattern — requireAdmin() first
// (defense-in-depth alongside src/middleware.ts, same rationale as every
// other admin action file), write through the RLS-respecting
// createClient(), never createServiceClient().
//
// Authorization for the actual write is enforced by "admins can update
// any lead" (0004_leads_site_visits_reveals.sql) — requireAdmin() here is
// the app-level check in front of that database-level backstop.
//
// Status values are the existing lead_status enum values only
// (new/contacted/qualified/site_visit/negotiation/closed/lost) — nothing
// new is introduced.

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";
import { createClient } from "@/lib/supabase/server";
import type { LeadStatus } from "./queries";

export interface ActionResult {
   success: boolean;
   error?: string;
}

const VALID_STATUSES: LeadStatus[] = ["new", "contacted", "qualified", "site_visit", "negotiation", "closed", "lost"];

/** Updates a lead's status. The only mutation the admin Leads Inbox needs. */
export async function updateLeadStatus(leadId: string, status: LeadStatus): Promise<ActionResult> {
   await requireAdmin();

   if (!VALID_STATUSES.includes(status)) {
      return { success: false, error: "Invalid status." };
   }

   const supabase = await createClient();

   // .select("id") returns the rows actually updated. RLS filters a
   // disallowed/nonexistent row out silently (no error, zero rows), so
   // without this check the UI would report a status change that never
   // happened.
   const { data, error } = await supabase.from("leads").update({ status }).eq("id", leadId).select("id");

   if (error) {
      return { success: false, error: error.message };
   }
   if (!data || data.length === 0) {
      return { success: false, error: "Lead not found, or you don't have permission to update it." };
   }

   revalidatePath("/admin/leads");
   revalidatePath(`/admin/leads/${leadId}`);
   revalidatePath("/admin");
   return { success: true };
}
