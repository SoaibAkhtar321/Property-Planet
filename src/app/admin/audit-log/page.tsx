import { getAdminAuditLog } from "@/lib/admin/audit-log/queries";

// requireAdmin() already runs in src/app/admin/layout.tsx (which every
// /admin/** page renders inside of) and src/middleware.ts before that —
// this page relies on that existing gate, same as every other page under
// /admin/**, rather than re-checking here.

export const dynamic = "force-dynamic";

const ACTION_LABELS: Record<string, string> = {
   role_change: "Role change",
   property_status_change: "Property status change",
   project_status_change: "Project status change",
};

function formatDetails(details: Record<string, unknown> | null): string {
   if (!details) return "—";
   const from = details.from;
   const to = details.to;
   if (from !== undefined && to !== undefined) {
      const reason = typeof details.rejection_reason === "string" ? details.rejection_reason : null;
      return `${from ?? "(none)"} → ${to ?? "(none)"}${reason ? ` — ${reason}` : ""}`;
   }
   return JSON.stringify(details);
}

export default async function AdminAuditLogPage({
   searchParams,
}: {
   searchParams: Promise<{ page?: string }>;
}) {
   const { page: pageParam } = await searchParams;
   const page = Math.max(0, Number(pageParam ?? "0") || 0);
   const { rows, hasMore } = await getAdminAuditLog(page);

   return (
      <div>
         <div className="d-flex justify-content-between align-items-center mb-4">
            <h3 className="m-0">Audit Log</h3>
         </div>
         <p className="text-muted mb-4">
            A read-only record of admin actions — role changes, and property/project moderation. Rows here
            cannot be edited or deleted from the app.
         </p>

         {rows.length === 0 ? (
            <p className="text-muted">No audit log entries yet.</p>
         ) : (
            <div className="table-responsive">
               <table className="table align-middle">
                  <thead>
                     <tr>
                        <th>When</th>
                        <th>Admin</th>
                        <th>Action</th>
                        <th>Target</th>
                        <th>Details</th>
                     </tr>
                  </thead>
                  <tbody>
                     {rows.map((row) => (
                        <tr key={row.id}>
                           <td>{new Date(row.createdAt).toLocaleString()}</td>
                           <td>{row.actorName ?? "(unknown)"}</td>
                           <td>{ACTION_LABELS[row.action] ?? row.action}</td>
                           <td>
                              {row.targetTable}/{row.targetId.slice(0, 8)}
                           </td>
                           <td>{formatDetails(row.details)}</td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         )}

         <div className="d-flex gap-2 mt-3">
            {page > 0 && (
               <a className="btn btn-outline-secondary btn-sm" href={`/admin/audit-log?page=${page - 1}`}>
                  Newer
               </a>
            )}
            {hasMore && (
               <a className="btn btn-outline-secondary btn-sm" href={`/admin/audit-log?page=${page + 1}`}>
                  Older
               </a>
            )}
         </div>
      </div>
   );
}
