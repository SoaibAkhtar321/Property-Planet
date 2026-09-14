import Link from "next/link";
import Image from "next/image";
import { getAdminOverviewMetrics } from "@/lib/admin/overview/queries";
import { getPropertiesForModeration } from "@/lib/admin/properties/queries";
import { getAdminLeads } from "@/lib/admin/leads/queries";
import AdminOverviewCharts from "@/components/admin/overview/AdminOverviewCharts";

import iconProperties from "@/assets/images/dashboard/icon/icon_12.svg";
import iconLeads from "@/assets/images/dashboard/icon/icon_13.svg";
import iconUsers from "@/assets/images/dashboard/icon/icon_14.svg";

export const dynamic = "force-dynamic";

function StatCard({ label, value, href }: { label: string; value: number; href?: string }) {
   const body = (
      <div className="bg-white border-30 h-100" style={{ padding: 25 }}>
         <div className="mb-10" style={{ fontSize: 14, opacity: 0.55 }}>{label}</div>
         <div className="fw-500" style={{ fontSize: 32 }}>{value}</div>
      </div>
   );
   return href ? (
      <Link href={href} className="text-decoration-none text-dark d-block h-100">
         {body}
      </Link>
   ) : (
      body
   );
}

function SectionTitle({ icon, children }: { icon: any; children: React.ReactNode }) {
   return (
      <h5 className="text-muted mb-20 d-flex align-items-center">
         <Image src={icon} alt="" width={22} height={22} className="me-2" />
         {children}
      </h5>
   );
}

function formatDate(iso: string) {
   return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function StatusPill({ status }: { status: string }) {
   const tone: Record<string, string> = {
      pending: "#FFB020",
      published: "#00B579",
      rejected: "#FF3F25",
      draft: "#8A8A8A",
      new: "#FF6725",
      contacted: "#2E90FA",
      qualified: "#2E90FA",
      site_visit: "#2E90FA",
      negotiation: "#7A5AF8",
      closed: "#00B579",
      lost: "#FF3F25",
   };
   const color = tone[status] ?? "#8A8A8A";
   return (
      <span
         className="d-inline-block"
         style={{
            fontSize: 12,
            fontWeight: 500,
            color,
            background: `${color}1A`,
            borderRadius: 20,
            padding: "4px 12px",
            textTransform: "capitalize",
         }}
      >
         {status.replace("_", " ")}
      </span>
   );
}

export default async function AdminOverviewPage() {
   const [metrics, pendingProperties, allLeads] = await Promise.all([
      getAdminOverviewMetrics(),
      getPropertiesForModeration(["pending"]),
      getAdminLeads(),
   ]);

   const recentPendingProperties = pendingProperties.slice(0, 5);
   const recentLeads = allLeads.slice(0, 5);

   return (
      <div>
         <h2 className="main-title d-block d-lg-none">Overview</h2>

         <SectionTitle icon={iconProperties}>Property Pipeline</SectionTitle>
         <div className="row g-3 mb-40">
            <div className="col-6 col-md-3">
               <StatCard label="Published" value={metrics.properties.published} href="/admin/properties?status=published" />
            </div>
            <div className="col-6 col-md-3">
               <StatCard label="Pending Approval" value={metrics.properties.pending} href="/admin/properties" />
            </div>
            <div className="col-6 col-md-3">
               <StatCard label="Rejected" value={metrics.properties.rejected} href="/admin/properties?status=rejected" />
            </div>
            <div className="col-6 col-md-3">
               <StatCard label="Draft" value={metrics.properties.draft} />
            </div>
         </div>

         <SectionTitle icon={iconLeads}>Lead Pipeline</SectionTitle>
         <div className="row g-3 mb-40">
            <div className="col-6 col-md-2">
               <StatCard label="Total" value={metrics.leads.total} href="/admin/leads" />
            </div>
            <div className="col-6 col-md-2">
               <StatCard label="New" value={metrics.leads.new} href="/admin/leads?status=new" />
            </div>
            <div className="col-6 col-md-2">
               <StatCard label="This Week" value={metrics.leads.thisWeek} />
            </div>
            <div className="col-6 col-md-2">
               <StatCard label="Contacted" value={metrics.leads.contacted} href="/admin/leads?status=contacted" />
            </div>
            <div className="col-6 col-md-2">
               <StatCard label="Converted" value={metrics.leads.converted} />
            </div>
            <div className="col-6 col-md-2">
               <StatCard label="Closed" value={metrics.leads.closed} href="/admin/leads?status=closed" />
            </div>
         </div>

         <SectionTitle icon={iconUsers}>User Overview</SectionTitle>
         <div className="row g-3 mb-40">
            <div className="col-6 col-md-3">
               <StatCard label="Buyers" value={metrics.users.buyers} href="/admin/users" />
            </div>
            <div className="col-6 col-md-3">
               <StatCard label="Sellers" value={metrics.users.sellers} href="/admin/users" />
            </div>
            <div className="col-6 col-md-3">
               <StatCard label="Admins" value={metrics.users.admins} />
            </div>
         </div>

         <AdminOverviewCharts properties={metrics.properties} leads={metrics.leads} />

         <div className="row">
            <div className="col-lg-6 mb-30">
               <div className="bg-white border-30 h-100" style={{ padding: 30 }}>
                  <div className="d-flex align-items-center justify-content-between mb-20">
                     <h5 className="m-0">Recent Pending Properties</h5>
                     <Link href="/admin/properties" style={{ fontSize: 14 }}>View all</Link>
                  </div>
                  {recentPendingProperties.length === 0 ? (
                     <p className="text-muted mb-0" style={{ fontSize: 14 }}>No properties pending approval.</p>
                  ) : (
                     <div className="d-flex flex-column gap-3">
                        {recentPendingProperties.map((p) => (
                           <div key={p.id} className="d-flex align-items-center justify-content-between border-bottom pb-3">
                              <div>
                                 <Link href={`/admin/properties/${p.id}`} className="text-dark fw-500 text-decoration-none">
                                    {p.title}
                                 </Link>
                                 <div style={{ fontSize: 13, opacity: 0.6 }}>
                                    {p.owner_name ?? "Unknown seller"}
                                    {p.city ? ` · ${p.city}` : ""}
                                 </div>
                              </div>
                              <div className="text-end">
                                 <StatusPill status={p.status} />
                                 <div style={{ fontSize: 12, opacity: 0.5, marginTop: 4 }}>{formatDate(p.created_at)}</div>
                              </div>
                           </div>
                        ))}
                     </div>
                  )}
               </div>
            </div>

            <div className="col-lg-6 mb-30">
               <div className="bg-white border-30 h-100" style={{ padding: 30 }}>
                  <div className="d-flex align-items-center justify-content-between mb-20">
                     <h5 className="m-0">Recent Leads</h5>
                     <Link href="/admin/leads" style={{ fontSize: 14 }}>View all</Link>
                  </div>
                  {recentLeads.length === 0 ? (
                     <p className="text-muted mb-0" style={{ fontSize: 14 }}>No leads yet.</p>
                  ) : (
                     <div className="d-flex flex-column gap-3">
                        {recentLeads.map((lead) => (
                           <div key={lead.id} className="d-flex align-items-center justify-content-between border-bottom pb-3">
                              <div>
                                 <Link href={`/admin/leads/${lead.id}`} className="text-dark fw-500 text-decoration-none">
                                    {lead.buyer_name ?? "Unknown buyer"}
                                 </Link>
                                 <div style={{ fontSize: 13, opacity: 0.6 }}>{lead.property_title}</div>
                              </div>
                              <div className="text-end">
                                 <StatusPill status={lead.status} />
                                 <div style={{ fontSize: 12, opacity: 0.5, marginTop: 4 }}>{formatDate(lead.created_at)}</div>
                              </div>
                           </div>
                        ))}
                     </div>
                  )}
               </div>
            </div>
         </div>
      </div>
   );
}