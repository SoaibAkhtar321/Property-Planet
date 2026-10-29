import Link from "next/link";
import { getAdminInsightData } from "@/lib/ai/insights";
import { getCachedInsight } from "@/lib/ai/insightQueries";
import { isAIEnabled } from "@/lib/ai/gemini";
import AiSummaryCard from "@/components/ai/AiSummaryCard";
import ReindexButton from "@/components/ai/ReindexButton";

// Access: src/app/admin/layout.tsx runs requireAdmin() for every /admin
// page, and every read below is RLS-scoped to admins as well.
export const dynamic = "force-dynamic";

export const metadata = { title: "AI Insights | Property Planet Admin" };

function Card({ title, children, hint }: { title: string; children: React.ReactNode; hint?: string }) {
   return (
      <div className="bg-white border-20 h-100" style={{ padding: 25 }}>
         <h6 className="mb-5">{title}</h6>
         {hint && <div className="fs-13 mb-15" style={{ opacity: 0.55 }}>{hint}</div>}
         {children}
      </div>
   );
}

function Stat({ label, value }: { label: string; value: string | number }) {
   return (
      <div className="bg-white border-20 h-100" style={{ padding: 20 }}>
         <div className="fs-14 mb-5" style={{ opacity: 0.55 }}>{label}</div>
         <div className="fw-500" style={{ fontSize: 28 }}>{value}</div>
      </div>
   );
}

const Empty = ({ children }: { children: React.ReactNode }) => (
   <p className="fs-14 mb-0" style={{ opacity: 0.6 }}>{children}</p>
);

export default async function AdminInsightsPage() {
   const [data, cached] = await Promise.all([getAdminInsightData(), getCachedInsight("admin", "admin")]);
   const aiEnabled = isAIEnabled();
   const pct = (n: number) => `${Math.round(n * 100)}%`;

   return (
      <div>
         <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-30">
            <div>
               <h3 className="mb-5">AI Insights</h3>
               <div className="fs-15" style={{ opacity: 0.6 }}>Last {data.windowDays} days of searches, enquiries and listings.</div>
            </div>
         </div>

         {!data.searchLogAvailable && (
            <div className="alert alert-info fs-15 mb-30">
               Search analytics start once database migration <code>0038_ai_search_and_insights.sql</code> is deployed.
            </div>
         )}

         <AiSummaryCard scope="admin" summary={cached?.summary ?? null} createdAt={cached?.createdAt ?? null} aiEnabled={aiEnabled} />

         <div className="row g-3 mb-30">
            <div className="col-6 col-lg-3"><Stat label="Searches" value={data.searches.total} /></div>
            <div className="col-6 col-lg-3"><Stat label="Searches with no results" value={pct(data.searches.zeroResultShare)} /></div>
            <div className="col-6 col-lg-3"><Stat label="Enquiries" value={data.leads.total} /></div>
            <div className="col-6 col-lg-3">
               <Stat
                  label="Awaiting approval"
                  value={data.moderation.pending ? `${data.moderation.pending}${data.moderation.oldestPendingDays !== null ? ` · oldest ${data.moderation.oldestPendingDays}d` : ""}` : 0}
               />
            </div>
         </div>

         <div className="row g-3 mb-30">
            <div className="col-lg-6">
               <Card title="What buyers search for" hint="Most frequent searches and the average number of results they got.">
                  {data.searches.topQueries.length === 0 ? (
                     <Empty>No searches recorded yet.</Empty>
                  ) : (
                     <table className="table fs-14 mb-0">
                        <thead><tr><th>Search</th><th className="text-end">Times</th><th className="text-end">Avg results</th></tr></thead>
                        <tbody>
                           {data.searches.topQueries.map((q) => (
                              <tr key={q.query}><td>{q.query}</td><td className="text-end">{q.count}</td><td className="text-end">{q.avgResults}</td></tr>
                           ))}
                        </tbody>
                     </table>
                  )}
               </Card>
            </div>
            <div className="col-lg-6">
               <Card title="Searches that found nothing" hint="Unmet demand — inventory buyers want but the site doesn't have.">
                  {data.searches.zeroResultQueries.length === 0 ? (
                     <Empty>Every recorded search returned results.</Empty>
                  ) : (
                     <table className="table fs-14 mb-0">
                        <thead><tr><th>Search</th><th className="text-end">Times</th></tr></thead>
                        <tbody>
                           {data.searches.zeroResultQueries.map((q) => (
                              <tr key={q.query}><td>{q.query}</td><td className="text-end">{q.count}</td></tr>
                           ))}
                        </tbody>
                     </table>
                  )}
               </Card>
            </div>
         </div>

         <div className="row g-3 mb-30">
            <div className="col-lg-6">
               <Card title="Demand vs. supply by locality" hint="Searches naming a locality, against its published listings.">
                  {data.demandVsSupply.length === 0 ? (
                     <Empty>No locality searches recorded yet.</Empty>
                  ) : (
                     <table className="table fs-14 mb-0">
                        <thead><tr><th>Locality</th><th className="text-end">Searches</th><th className="text-end">Listings</th></tr></thead>
                        <tbody>
                           {data.demandVsSupply.map((d) => (
                              <tr key={d.locality}>
                                 <td>{d.locality}{d.searches >= 3 && d.listings <= 1 && <span className="ms-2 badge bg-warning text-dark">gap</span>}</td>
                                 <td className="text-end">{d.searches}</td>
                                 <td className="text-end">{d.listings}</td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                  )}
               </Card>
            </div>
            <div className="col-lg-6">
               <Card title="Enquiries" hint="By stage, and the listings attracting the most.">
                  {data.leads.total === 0 ? (
                     <Empty>No enquiries in this period.</Empty>
                  ) : (
                     <>
                        <div className="d-flex flex-wrap gap-2 mb-15">
                           {data.leads.byStatus.map((s) => (
                              <span key={s.status} className="fs-13" style={{ background: "rgba(0,0,0,0.05)", borderRadius: 20, padding: "4px 12px", textTransform: "capitalize" }}>
                                 {s.status.replace("_", " ")}: {s.count}
                              </span>
                           ))}
                        </div>
                        <ol className="fs-14 mb-0 ps-3">
                           {data.leads.topListings.map((l) => (
                              <li key={l.title + l.count}>
                                 {l.slug ? <Link href={`/properties/${l.slug}`}>{l.title}</Link> : l.title} — {l.count}
                              </li>
                           ))}
                        </ol>
                     </>
                  )}
               </Card>
            </div>
         </div>

         <div className="row g-3 mb-30">
            <div className="col-lg-6">
               <Card title="Listings to improve" hint="Published listings missing photos or with a very short description.">
                  {data.quality.noPhotos.length === 0 && data.quality.shortDescription.length === 0 ? (
                     <Empty>All published listings have photos and a description.</Empty>
                  ) : (
                     <ul className="fs-14 mb-0 ps-3">
                        {data.quality.noPhotos.map((p) => (
                           <li key={`np-${p.id}`}><Link href={`/admin/properties/${p.id}`}>{p.title}</Link> — no photos</li>
                        ))}
                        {data.quality.shortDescription.map((p) => (
                           <li key={`sd-${p.id}`}><Link href={`/admin/properties/${p.id}`}>{p.title}</Link> — short description</li>
                        ))}
                     </ul>
                  )}
               </Card>
            </div>
            <div className="col-lg-6">
               <Card title="Semantic search index" hint="Listings searchable by meaning. New and edited listings are indexed automatically.">
                  <p className="fs-15">
                     {data.search.indexed === null
                        ? "Index status unavailable (service key or migration 0038 missing)."
                        : `${data.search.indexed} of ${data.search.published} published listings indexed.`}
                  </p>
                  {aiEnabled ? (
                     <ReindexButton />
                  ) : (
                     <Empty>Set GEMINI_API_KEY to enable semantic search; keyword search with AI-style filters works meanwhile.</Empty>
                  )}
               </Card>
            </div>
         </div>
      </div>
   );
}
