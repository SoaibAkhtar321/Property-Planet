"use client";

// Shared "AI summary" card for the admin and seller insights pages. The
// summary itself is rendered from the server-cached copy; this component
// only triggers regeneration and shows its result.

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { generateAdminInsights, generateSellerInsights, type InsightSummary } from "@/lib/ai/insightActions";

interface Props {
   scope: "admin" | "seller";
   summary: InsightSummary | null;
   createdAt: string | null;
   aiEnabled: boolean;
}

const formatWhen = (iso: string) =>
   new Date(iso).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

export default function AiSummaryCard({ scope, summary, createdAt, aiEnabled }: Props) {
   const router = useRouter();
   const [pending, startTransition] = useTransition();
   const [error, setError] = useState<string | null>(null);

   const generate = () => {
      setError(null);
      startTransition(async () => {
         const result = scope === "admin" ? await generateAdminInsights() : await generateSellerInsights();
         if (!result.success) setError(result.error);
         else router.refresh();
      });
   };

   return (
      <div className="bg-white border-20 mb-30" style={{ padding: 25 }}>
         <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-15">
            <div>
               <h5 className="mb-5">
                  <i className="fa-light fa-sparkles me-2" aria-hidden="true"></i>
                  AI summary
               </h5>
               <div className="fs-14" style={{ opacity: 0.6 }}>
                  {createdAt ? `Generated ${formatWhen(createdAt)} from the figures on this page.` : "Written from the figures on this page — never invented."}
               </div>
            </div>
            {aiEnabled && (
               <button type="button" onClick={generate} disabled={pending} className="dash-btn-two tran3s" aria-busy={pending}>
                  {pending ? "Generating…" : summary ? "Refresh summary" : "Generate summary"}
               </button>
            )}
         </div>

         {error && (
            <div className="alert alert-warning fs-14 mb-15" role="alert">
               {error}
            </div>
         )}

         {!aiEnabled && (
            <p className="fs-15 mb-0" style={{ opacity: 0.75 }}>
               {scope === "admin" ? (
                  <>
                     AI summaries are switched off. Set <code>GEMINI_API_KEY</code> in the hosting environment to enable them — every
                     metric below works without it.
                  </>
               ) : (
                  "AI suggestions aren't available yet. Your listing checklist below still shows what to improve."
               )}
            </p>
         )}

         {aiEnabled && !summary && !error && (
            <p className="fs-15 mb-0" style={{ opacity: 0.75 }}>
               No summary yet. Generate one to get a plain-language read of these numbers with suggested next steps.
            </p>
         )}

         {summary && (
            <>
               <p className="fs-18 fw-500 color-dark mb-20">{summary.headline}</p>
               <div className="row">
                  {summary.insights.map((item) => (
                     <div key={item.title} className="col-md-6 mb-15">
                        <div className="fw-500 mb-5">{item.title}</div>
                        <div className="fs-15" style={{ opacity: 0.8 }}>{item.detail}</div>
                     </div>
                  ))}
               </div>
               {summary.actions.length > 0 && (
                  <>
                     <div className="fw-500 mt-10 mb-10">Suggested next steps</div>
                     <ol className="fs-15 mb-0 ps-3">
                        {summary.actions.map((a) => (
                           <li key={a} className="mb-5">{a}</li>
                        ))}
                     </ol>
                  </>
               )}
            </>
         )}
      </div>
   );
}
