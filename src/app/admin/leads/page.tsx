import Link from "next/link";
import { getAdminLeads, type LeadStatus } from "@/lib/admin/leads/queries";

export const dynamic = "force-dynamic";

const STATUS_OPTIONS: LeadStatus[] = ["new", "contacted", "qualified", "site_visit", "negotiation", "closed", "lost"];

const statusBadgeClass: Record<string, string> = {
   new: "bg-primary",
   contacted: "bg-info text-dark",
   qualified: "bg-warning text-dark",
   site_visit: "bg-warning text-dark",
   negotiation: "bg-secondary",
   closed: "bg-success",
   lost: "bg-dark",
};

export default async function AdminLeadsPage({
   searchParams,
}: {
   searchParams: Promise<{ status?: string; search?: string }>;
}) {
   const params = await searchParams;
   const status = STATUS_OPTIONS.includes(params.status as LeadStatus) ? (params.status as LeadStatus) : undefined;
   const search = params.search ?? "";

   const leads = await getAdminLeads({ status, search });

   return (
      <div>
         <div className="d-flex justify-content-between align-items-center mb-4">
            <h3 className="m-0">Leads</h3>
         </div>

         <form className="d-flex gap-2 mb-4" method="get">
            <select name="status" defaultValue={status ?? ""} className="form-select" style={{ maxWidth: 200 }}>
               <option value="">All statuses</option>
               {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                     {s.replace("_", " ")}
                  </option>
               ))}
            </select>
            <input
               type="text"
               name="search"
               defaultValue={search}
               placeholder="Search buyer, property, or seller"
               className="form-control"
            />
            <button type="submit" className="btn btn-outline-secondary">
               Filter
            </button>
            {(status || search) && (
               <Link href="/admin/leads" className="btn btn-outline-secondary">
                  Clear
               </Link>
            )}
         </form>

         {leads.length === 0 ? (
            <p className="text-muted">No leads yet.</p>
         ) : (
            <table className="table align-middle">
               <thead>
                  <tr>
                     <th>Date</th>
                     <th>Buyer</th>
                     <th>Property</th>
                     <th>Seller/Agent</th>
                     <th>Status</th>
                     <th>Message</th>
                     <th></th>
                  </tr>
               </thead>
               <tbody>
                  {leads.map((lead) => (
                     <tr key={lead.id}>
                        <td className="text-muted small">{new Date(lead.created_at).toLocaleString()}</td>
                        <td>
                           <div>{lead.buyer_name ?? "—"}</div>
                           <div className="text-muted small">{lead.buyer_phone ?? "no phone on file"}</div>
                        </td>
                        <td>
                           <div>{lead.property_title}</div>
                           {lead.property_slug && <div className="text-muted small">/{lead.property_slug}</div>}
                        </td>
                        <td>{lead.seller_name ?? "—"}</td>
                        <td>
                           <span className={`badge ${statusBadgeClass[lead.status] ?? "bg-secondary"}`}>
                              {lead.status.replace("_", " ")}
                           </span>
                        </td>
                        <td className="text-truncate" style={{ maxWidth: 220 }}>
                           {lead.message ?? <span className="text-muted">—</span>}
                        </td>
                        <td>
                           <Link href={`/admin/leads/${lead.id}`} className="btn btn-sm btn-outline-primary">
                              Open
                           </Link>
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
         )}
      </div>
   );
}
