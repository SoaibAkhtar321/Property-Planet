"use client";

// Phase 27: a route-level error boundary for the listing. Next renders this
// instead of an unstyled crash screen when the server component throws.
//
// The `error` object is deliberately never rendered: in production it may
// carry a database message or internal path. The digest is shown instead,
// which is the opaque id Next generates and the only thing useful for
// correlating with server logs.

import Link from "next/link";

export default function PropertiesError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
   return (
      <div className="container" style={{ paddingTop: 200, paddingBottom: 150 }}>
         <h2 className="font-garamond">We couldn&apos;t load these properties</h2>
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
