"use client";

// A route-level error boundary for the place discovery page — same
// convention as src/app/properties/error.tsx, including never rendering
// `error` itself (it may carry a database message or internal path).

import Link from "next/link";

export default function PlaceError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
   return (
      <div className="container" style={{ paddingTop: 200, paddingBottom: 150 }}>
         <h2 className="font-garamond">We couldn&apos;t load this area</h2>
         <p className="fs-20 mt-10">
            Something went wrong on our side. Please try again — if it keeps happening, the team has been notified.
         </p>
         {error.digest && <p className="fs-14 text-muted">Reference: {error.digest}</p>}
         <div className="d-flex flex-wrap gap-3 mt-30">
            <button type="button" className="btn-four" onClick={reset}>
               Try again
            </button>
            <Link href="/properties" className="btn-four">
               Browse all properties
            </Link>
         </div>
      </div>
   );
}
