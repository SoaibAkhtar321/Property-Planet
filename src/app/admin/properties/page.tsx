import Link from "next/link";
import { getPropertiesForModeration, type PropertyStatus } from "@/lib/admin/properties/queries";
import { priceUnitSuffix } from "@/lib/properties/priceUnit";

export const dynamic = "force-dynamic";

const STATUS_OPTIONS: PropertyStatus[] = ["pending", "published", "rejected", "draft", "sold", "archived"];

const statusBadgeClass: Record<string, string> = {
   draft: "bg-secondary",
   pending: "bg-warning text-dark",
   published: "bg-success",
   rejected: "bg-danger",
   sold: "bg-info text-dark",
   archived: "bg-dark",
};

export default async function AdminPropertiesPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
   const params = await searchParams;
   const status = STATUS_OPTIONS.includes(params.status as PropertyStatus) ? (params.status as PropertyStatus) : "pending";

   const properties = await getPropertiesForModeration([status]);

   return (
      <div>
         <div className="d-flex justify-content-between align-items-center mb-4">
            <h3 className="m-0">Property moderation</h3>
            <Link href="/admin/properties/new" className="btn btn-sm btn-primary">
               Add Listing
            </Link>
         </div>

         <div className="btn-group mb-4">
            {STATUS_OPTIONS.map((s) => (
               <Link
                  key={s}
                  href={`/admin/properties?status=${s}`}
                  className={`btn btn-sm ${status === s ? "btn-primary" : "btn-outline-secondary"}`}
               >
                  {s}
               </Link>
            ))}
         </div>

         {properties.length === 0 ? (
            <p className="text-muted">No properties are waiting for approval.</p>
         ) : (
            <div className="table-responsive">
               <table className="table align-middle">
                  <thead>
                     <tr>
                        <th>Title</th>
                        <th>Type</th>
                        <th>Price</th>
                        <th>Location</th>
                        <th>Seller</th>
                        <th>Status</th>
                        <th>Featured</th>
                        <th>Submitted</th>
                        <th></th>
                     </tr>
                  </thead>
                  <tbody>
                     {properties.map((p) => (
                        <tr key={p.id}>
                           <td>
                              <Link href={`/admin/properties/${p.id}`}>{p.title}</Link>
                           </td>
                           <td className="text-muted small">
                              {p.property_type}
                              <div>{p.project_id ? "Project unit" : "Individual"}</div>
                           </td>
                           <td>
                              ₹{Number(p.price).toLocaleString("en-IN")}
                              {priceUnitSuffix(p.price_unit, p.price_unit_label) && (
                                 <sub>{priceUnitSuffix(p.price_unit, p.price_unit_label)}</sub>
                              )}
                           </td>
                           <td>
                              {p.city}, {p.locality}
                           </td>
                           <td>{p.owner_name ?? "—"}</td>
                           <td>
                              <span className={`badge ${statusBadgeClass[p.status] ?? "bg-secondary"}`}>{p.status}</span>
                           </td>
                           <td>{p.is_featured ? <span className="badge bg-success">Featured</span> : "—"}</td>
                           <td className="text-muted small">{new Date(p.created_at).toLocaleDateString()}</td>
                           <td>
                              <Link href={`/admin/properties/${p.id}`} className="btn btn-sm btn-outline-primary">
                                 Review
                              </Link>
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         )}
      </div>
   );
}
