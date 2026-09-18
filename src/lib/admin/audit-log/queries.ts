// src/lib/admin/audit-log/queries.ts
//
// Admin-only read for /admin/audit-log, backing admin_audit_log (0028).
// Same pattern as every other admin query file: reads through the
// RLS-respecting createClient(), authorized by "admins can read audit
// log" (0028) — never the service client, since there's no privileged
// operation here beyond what that policy already allows an admin.
//
// Actor name resolution: admin_audit_log.actor_id references profiles,
// but an actor may have since been demoted/deleted — the join is a LEFT
// join equivalent (actor may be null), same reasoning as
// properties.created_by (0006) and notifications.recipient_id joins
// elsewhere in the admin area.

import { createClient } from "@/lib/supabase/server";

export interface AdminAuditLogRow {
   id: string;
   actorId: string | null;
   actorName: string | null;
   action: string;
   targetTable: string;
   targetId: string;
   details: Record<string, unknown> | null;
   createdAt: string;
}

const PAGE_SIZE = 50;

/** Most recent admin_audit_log rows, newest first. Caller must already be behind requireAdmin(). */
export async function getAdminAuditLog(page = 0): Promise<{ rows: AdminAuditLogRow[]; hasMore: boolean }> {
   const supabase = await createClient();

   const from = page * PAGE_SIZE;
   const to = from + PAGE_SIZE; // fetch one extra to detect "has more" without a second count query

   const { data, error } = await supabase
      .from("admin_audit_log")
      .select("id, actor_id, action, target_table, target_id, details, created_at, profiles(full_name)")
      .order("created_at", { ascending: false })
      .range(from, to);

   if (error || !data) {
      return { rows: [], hasMore: false };
   }

   const hasMore = data.length > PAGE_SIZE;
   const pageRows = hasMore ? data.slice(0, PAGE_SIZE) : data;

   return {
      hasMore,
      rows: pageRows.map((row) => {
         const profile = row.profiles as unknown as { full_name: string | null } | { full_name: string | null }[] | null;
         const actorName = Array.isArray(profile) ? profile[0]?.full_name ?? null : profile?.full_name ?? null;
         return {
            id: row.id,
            actorId: row.actor_id,
            actorName,
            action: row.action,
            targetTable: row.target_table,
            targetId: row.target_id,
            details: (row.details as Record<string, unknown> | null) ?? null,
            createdAt: row.created_at,
         };
      }),
   };
}
