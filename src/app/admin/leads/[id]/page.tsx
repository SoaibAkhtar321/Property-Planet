import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminLeadDetail, LEAD_KIND_LABELS, type LeadStatus } from "@/lib/admin/leads/queries";
import { updateLeadStatus } from "@/lib/admin/leads/actions";

export const dynamic = "force-dynamic";

const STATUS_OPTIONS: LeadStatus[] = ["new", "contacted", "qualified", "site_visit", "negotiation", "closed", "lost"];

export default async function AdminLeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
   const { id } = await params;
   const lead = await getAdminLeadDetail(id);

   if (!lead) {
      notFound();
   }

   const updateStatus = async (formData: FormData) => {
      "use server";
      const status = String(formData.get("status")) as LeadStatus;
      await updateLeadStatus(id, status);
   };

   return (
      <div>
         <div className="mb-3">
            <Link href="/admin/leads" className="text-decoration-none">
               ← Back to Leads
            </Link>
         </div>

         <div className="d-flex justify-content-between align-items-start mb-4">
            <div>
               <h3 className="m-0">Lead detail</h3>
               <span className="badge bg-secondary mt-2">{LEAD_KIND_LABELS[lead.kind]}</span>
            </div>
            <form action={updateStatus} className="d-flex gap-2">
               <select name="status" defaultValue={lead.status} className="form-select form-select-sm">
                  {STATUS_OPTIONS.map((s) => (
                     <option key={s} value={s}>
                        {s.replace("_", " ")}
                     </option>
                  ))}
               </select>
               <button type="submit" className="btn btn-sm btn-primary">
                  Update status
               </button>
            </form>
         </div>

         <div className="row g-4">
            <div className="col-md-4">
               <div className="border rounded p-3 h-100">
                  <h6 className="text-muted">Buyer</h6>
                  <div className="fw-bold">{lead.buyer_name ?? "—"}</div>
                  <div>{lead.buyer_phone ?? "No phone on file"}</div>
                  <div>{lead.buyer_email ?? <span className="text-muted">No email on file</span>}</div>
                  <div className="text-muted small mt-2">Inquired {new Date(lead.created_at).toLocaleString()}</div>
                  {lead.message && (
                     <div className="mt-3">
                        <div className="text-muted small">Message</div>
                        <div>{lead.message}</div>
                     </div>
                  )}
               </div>
            </div>

            <div className="col-md-4">
               <div className="border rounded p-3 h-100">
                  <h6 className="text-muted">Enquired about</h6>

                  {lead.property_id ? (
                     <>
                        <div className="fw-bold">{lead.property_title}</div>
                        <div className="text-muted small">
                           {lead.property_type} · {lead.listing_type}
                        </div>
                        <div>
                           {lead.city}, {lead.locality}
                        </div>
                        <div className="mt-2">
                           <span className="badge bg-secondary">{lead.property_status}</span>
                        </div>
                        {lead.property_slug && (
                           <div className="mt-3">
                              <Link
                                 href={`/properties/${lead.property_slug}`}
                                 className="btn btn-sm btn-outline-secondary"
                                 target="_blank"
                              >
                                 View listing
                              </Link>
                           </div>
                        )}
                     </>
                  ) : (
                     <div className="text-muted small">
                        Project-level enquiry — the buyer asked about the project as a whole, not a specific unit.
                     </div>
                  )}

                  {lead.project_id && (
                     <div className="mt-3 pt-3 border-top">
                        <div className="text-muted small">Project</div>
                        <div className="fw-bold">{lead.project_title}</div>
                        {lead.project_status && (
                           <span className="badge bg-secondary mt-1">{lead.project_status}</span>
                        )}
                        <div className="mt-2 d-flex gap-2 flex-wrap">
                           {lead.project_slug && (
                              <Link
                                 href={`/projects/${lead.project_slug}`}
                                 className="btn btn-sm btn-outline-secondary"
                                 target="_blank"
                              >
                                 View project
                              </Link>
                           )}
                           <Link href={`/admin/projects/${lead.project_id}`} className="btn btn-sm btn-outline-secondary">
                              Manage project
                           </Link>
                        </div>
                     </div>
                  )}
               </div>
            </div>

            <div className="col-md-4">
               <div className="border rounded p-3 h-100">
                  <h6 className="text-muted">Seller / Agent</h6>
                  {lead.property_id ? (
                     <>
                        <div className="fw-bold">{lead.seller_name ?? "—"}</div>
                        <div>{lead.seller_phone ?? "No phone on file"}</div>
                     </>
                  ) : (
                     <div className="text-muted small">
                        No individual seller — project enquiries are handled by the Property Planet team.
                     </div>
                  )}
               </div>
            </div>
         </div>

         {lead.site_visits.length > 0 && (
            <div className="mt-4">
               <h6 className="text-muted">Site visits</h6>
               <table className="table table-sm">
                  <thead>
                     <tr>
                        <th>Scheduled</th>
                        <th>Status</th>
                        <th>Notes</th>
                     </tr>
                  </thead>
                  <tbody>
                     {lead.site_visits.map((v) => (
                        <tr key={v.id}>
                           <td>{v.scheduled_at ? new Date(v.scheduled_at).toLocaleString() : "—"}</td>
                           <td>{v.status}</td>
                           <td>{v.notes ?? "—"}</td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         )}
      </div>
   );
}
