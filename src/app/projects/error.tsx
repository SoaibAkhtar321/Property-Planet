"use client";

// Phase 27: route-level error boundary for Featured Opportunities. Same
// reasoning as src/app/properties/error.tsx — the raw error is never shown,
// only Next's opaque digest.

import Link from "next/link";

export default function ProjectsError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
   return (
      <div className="container" style={{ paddingTop: 200, paddingBottom: 150 }}>
         <h2 className="font-garamond">We couldn&apos;t load these opportunities</h2>
         <p className="fs-20 mt-10">
            Something went wrong on our side. Please try again — if it keeps happening, the team has been notified.
         </p>
         {error.digest && <p className="fs-14 text-muted">Reference: {error.digest}</p>}
         <div className="d-flex flex-wrap gap-3 mt-30">
            <button type="button" className="btn-four" onClick={reset}>
               Try again
            </button>
            <Link href="/" className="btn-four">
               Back to home
            </Link>
         </div>
      </div>
   );
}
