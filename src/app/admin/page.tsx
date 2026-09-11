import Link from "next/link";
import { getAdminOverviewMetrics } from "@/lib/admin/overview/queries";

export const dynamic = "force-dynamic";

function MetricCard({ label, value, href }: { label: string; value: number; href?: string }) {
   const body = (
      <div className="border rounded p-3 h-100">
         <div className="text-muted small">{label}</div>
         <div className="fs-3 fw-bold">{value}</div>
      </div>
   );
   return href ? (
      <Link href={href} className="text-decoration-none text-dark d-block">
         {body}
      </Link>
   ) : (
      body
   );
}

export default async function AdminOverviewPage() {
   const metrics = await getAdminOverviewMetrics();

   return (
      <div>
         <h3 className="mb-4">Overview</h3>

         <h5 className="text-muted mb-3">Properties</h5>
         <div className="row g-3 mb-4">
            <div className="col-6 col-md-3">
               <MetricCard label="Published" value={metrics.properties.published} href="/admin/properties?status=published" />
            </div>
            <div className="col-6 col-md-3">
               <MetricCard label="Pending approval" value={metrics.properties.pending} href="/admin/properties" />
            </div>
            <div className="col-6 col-md-3">
               <MetricCard label="Rejected" value={metrics.properties.rejected} href="/admin/properties?status=rejected" />
            </div>
            <div className="col-6 col-md-3">
               <MetricCard label="Draft" value={metrics.properties.draft} />
            </div>
         </div>

         <h5 className="text-muted mb-3">Leads</h5>
         <div className="row g-3 mb-4">
            <div className="col-6 col-md-2">
               <MetricCard label="Total" value={metrics.leads.total} href="/admin/leads" />
            </div>
            <div className="col-6 col-md-2">
               <MetricCard label="New" value={metrics.leads.new} href="/admin/leads?status=new" />
            </div>
            <div className="col-6 col-md-2">
               <MetricCard label="This week" value={metrics.leads.thisWeek} />
            </div>
            <div className="col-6 col-md-2">
               <MetricCard label="Contacted" value={metrics.leads.contacted} href="/admin/leads?status=contacted" />
            </div>
            <div className="col-6 col-md-2">
               <MetricCard label="Converted" value={metrics.leads.converted} />
            </div>
            <div className="col-6 col-md-2">
               <MetricCard label="Closed" value={metrics.leads.closed} href="/admin/leads?status=closed" />
            </div>
         </div>

         <h5 className="text-muted mb-3">Users</h5>
         <div className="row g-3">
            <div className="col-6 col-md-3">
               <MetricCard label="Buyers" value={metrics.users.buyers} href="/admin/users" />
            </div>
            <div className="col-6 col-md-3">
               <MetricCard label="Sellers" value={metrics.users.sellers} href="/admin/users" />
            </div>
            <div className="col-6 col-md-3">
               <MetricCard label="Admins" value={metrics.users.admins} />
            </div>
         </div>
      </div>
   );
}
