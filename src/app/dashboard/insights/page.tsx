import Link from "next/link";
import Wrapper from "@/layouts/Wrapper";
import DashboardHeaderTwo from "@/layouts/headers/dashboard/DashboardHeaderTwo";
import { requireRole } from "@/lib/auth/session";
import { getSellerInsightData } from "@/lib/ai/insights";
import { getCachedInsight } from "@/lib/ai/insightQueries";
import { isAIEnabled } from "@/lib/ai/gemini";
import AiSummaryCard from "@/components/ai/AiSummaryCard";
import { formatINR } from "@/utils/propertyPlanetAIEngine";

export const dynamic = "force-dynamic";

export const metadata = {
   title: "Property Planet — Listing Insights",
};

const StatusPill = ({ status }: { status: string }) => (
   <span className="fs-13" style={{ background: "rgba(0,0,0,0.05)", borderRadius: 20, padding: "3px 10px", textTransform: "capitalize" }}>
      {status}
   </span>
);

export default async function SellerInsightsPage() {
   // Seller-only, like the other listing pages (middleware is the first gate).
   const ctx = await requireRole(["seller"]);
   const [data, cached] = await Promise.all([getSellerInsightData(ctx.userId), getCachedInsight("seller", ctx.userId)]);
   const totalDemand = data.demand.reduce((sum, d) => sum + d.searches, 0);

   return (
      <Wrapper>
         <div className="dashboard-body">
            <div className="position-relative">
               <DashboardHeaderTwo title="Insights" />
               <h2 className="main-title d-block d-lg-none">Insights</h2>

               <div className="row g-3 mb-30">
                  <div className="col-md-4">
                     <div className="dash-card-one bg-white border-30 position-relative">
                        <span>Enquiries (last {data.windowDays} days)</span>
                        <div className="value fw-500">{data.totals.leads30d}</div>
                     </div>
                  </div>
                  <div className="col-md-4">
                     <div className="dash-card-one bg-white border-30 position-relative">
                        <span>Searches for your localities</span>
                        <div className="value fw-500">{totalDemand}</div>
                     </div>
                  </div>
                  <div className="col-md-4">
                     <div className="dash-card-one bg-white border-30 position-relative">
                        <span>Live listings</span>
                        <div className="value fw-500">{data.totals.published}</div>
                     </div>
                  </div>
               </div>

               <AiSummaryCard scope="seller" summary={cached?.summary ?? null} createdAt={cached?.createdAt ?? null} aiEnabled={isAIEnabled()} />

               {data.demand.length > 0 && (
                  <div className="bg-white border-20 mb-30" style={{ padding: 25 }}>
                     <h5 className="mb-5">Buyer demand in your areas</h5>
                     <div className="fs-14 mb-15" style={{ opacity: 0.6 }}>
                        How many searches on Property Planet mentioned each locality you list in, over the last {data.windowDays} days.
                     </div>
                     <div className="d-flex flex-wrap gap-2">
                        {data.demand.map((d) => (
                           <span key={d.locality} className="fs-14" style={{ background: "rgba(0,0,0,0.05)", borderRadius: 20, padding: "6px 14px", textTransform: "capitalize" }}>
                              {d.locality}: <strong>{d.searches}</strong>
                           </span>
                        ))}
                     </div>
                  </div>
               )}

               <div className="bg-white border-20" style={{ padding: 25 }}>
                  <h5 className="mb-20">Your listings</h5>
                  {data.listings.length === 0 ? (
                     <p className="mb-0">
                        You have no listings yet. <Link href="/dashboard/add-property">Add your first property</Link> to see insights here.
                     </p>
                  ) : (
                     data.listings.map((l) => (
                        <div key={l.id} className="pb-20 mb-20" style={{ borderBottom: "1px solid rgba(0,0,0,0.08)" }}>
                           <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-10">
                              <div className="fw-500 fs-17">
                                 {l.status === "published" ? <Link href={`/properties/${l.slug}`}>{l.title}</Link> : l.title}
                                 <span className="ms-2"><StatusPill status={l.status} /></span>
                              </div>
                              <Link href={`/dashboard/edit-property/${l.id}`} className="fs-14 text-decoration-underline">Edit listing</Link>
                           </div>
                           <div className="d-flex flex-wrap gap-4 fs-14 mb-10" style={{ opacity: 0.8 }}>
                              <span>{l.price ? formatINR(l.price) : "No price"}</span>
                              <span>{l.leads30d} enquiries this month · {l.leadsTotal} total</span>
                              <span>{l.photos} photo{l.photos === 1 ? "" : "s"}</span>
                           </div>
                           {l.priceBenchmark && <div className="fs-14 mb-10">Price check: {l.priceBenchmark}.</div>}
                           {l.checklist.length > 0 ? (
                              <ul className="fs-14 mb-0 ps-3">
                                 {l.checklist.map((item) => (
                                    <li key={item}>{item}</li>
                                 ))}
                              </ul>
                           ) : (
                              <div className="fs-14" style={{ color: "#00B579" }}>This listing has everything buyers look for.</div>
                           )}
                        </div>
                     ))
                  )}
               </div>
            </div>
         </div>
      </Wrapper>
   );
}
