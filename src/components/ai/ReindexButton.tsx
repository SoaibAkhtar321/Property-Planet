"use client";

// Admin button: (re)build the semantic search index for all published
// listings. Safe to press repeatedly — unchanged listings are skipped.

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { reindexPropertyEmbeddings } from "@/lib/ai/insightActions";

export default function ReindexButton({ disabled }: { disabled?: boolean }) {
   const router = useRouter();
   const [pending, startTransition] = useTransition();
   const [message, setMessage] = useState<string | null>(null);

   const run = () => {
      setMessage(null);
      startTransition(async () => {
         const r = await reindexPropertyEmbeddings();
         if (!r.success) {
            setMessage(r.error);
            return;
         }
         setMessage(
            `Done: ${r.embedded} indexed, ${r.unchanged} already up to date${r.failed ? `, ${r.failed} failed (try again)` : ""}.`,
         );
         router.refresh();
      });
   };

   return (
      <div>
         <button type="button" onClick={run} disabled={pending || disabled} className="dash-btn-two tran3s" aria-busy={pending}>
            {pending ? "Indexing…" : "Rebuild search index"}
         </button>
         {message && (
            <div className="fs-14 mt-10" role="status">
               {message}
            </div>
         )}
      </div>
   );
}
