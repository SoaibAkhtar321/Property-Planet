import { getAllUsersForAdmin } from "@/lib/admin/users/queries";
import { grantSellerAccess } from "@/lib/admin/users/actions";

export const dynamic = "force-dynamic";

const roleBadgeClass: Record<string, string> = {
   buyer: "bg-secondary",
   seller: "bg-success",
   admin: "bg-dark",
};

export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<{ search?: string }> }) {
   const { search } = await searchParams;
   const users = await getAllUsersForAdmin();

   const term = (search ?? "").trim().toLowerCase();
   const filtered = term
      ? users.filter(
           (u) =>
              (u.full_name ?? "").toLowerCase().includes(term) ||
              (u.email ?? "").toLowerCase().includes(term) ||
              (u.phone ?? "").toLowerCase().includes(term)
        )
      : users;

   return (
      <div>
         <div className="d-flex justify-content-between align-items-center mb-4">
            <h3 className="m-0">Users</h3>
         </div>

         <form className="d-flex gap-2 mb-4" method="get">
            <input type="text" name="search" defaultValue={search ?? ""} placeholder="Search name, email, or phone" className="form-control" style={{ maxWidth: 320 }} />
            <button type="submit" className="btn btn-outline-secondary">
               Search
            </button>
         </form>

         {filtered.length === 0 ? (
            <p className="text-muted">No users found.</p>
         ) : (
            <table className="table align-middle">
               <thead>
                  <tr>
                     <th>Name</th>
                     <th>Email</th>
                     <th>Phone</th>
                     <th>Role</th>
                     <th>Joined</th>
                     <th></th>
                  </tr>
               </thead>
               <tbody>
                  {filtered.map((u) => {
                     const grant = async () => {
                        "use server";
                        await grantSellerAccess(u.id);
                     };
                     return (
                        <tr key={u.id}>
                           <td>{u.full_name ?? "—"}</td>
                           <td>{u.email ?? "—"}</td>
                           <td>{u.phone ?? "—"}</td>
                           <td>
                              <span className={`badge ${roleBadgeClass[u.role] ?? "bg-secondary"}`}>{u.role}</span>
                           </td>
                           <td className="text-muted small">{new Date(u.created_at).toLocaleDateString()}</td>
                           <td>
                              {u.role === "buyer" && (
                                 <form action={grant}>
                                    <button type="submit" className="btn btn-sm btn-outline-success">
                                       Grant seller access
                                    </button>
                                 </form>
                              )}
                           </td>
                        </tr>
                     );
                  })}
               </tbody>
            </table>
         )}
      </div>
   );
}
