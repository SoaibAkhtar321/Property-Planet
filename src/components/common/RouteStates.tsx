"use client";

// src/components/common/RouteStates.tsx
//
// Shared loading / error UI for the route-level loading.tsx and error.tsx
// files added for the dashboard, admin, blog and the site root. Follows the
// same pattern as the existing properties/projects/places boundaries
// (plain container, no new design language, no animation beyond Bootstrap's
// own small spinner).
//
// The error object is never rendered: in production it can carry a database
// message or an internal path. Only Next's opaque `digest` is shown, which is
// what correlates with server logs.

import Link from "next/link";

export const RouteLoading = ({ label = "Loading…" }: { label?: string }) => (
   <div className="container d-flex align-items-center justify-content-center" style={{ minHeight: "60vh", paddingTop: 120 }} aria-busy="true">
      <div className="d-flex align-items-center gap-3" role="status">
         <span className="spinner-border spinner-border-sm" aria-hidden="true" />
         <span className="fs-20">{label}</span>
      </div>
   </div>
);

export const RouteError = ({
   error,
   reset,
   title = "Something went wrong",
   homeHref = "/",
   homeLabel = "Back to home",
}: {
   error: Error & { digest?: string };
   reset: () => void;
   title?: string;
   homeHref?: string;
   homeLabel?: string;
}) => (
   <div className="container" style={{ paddingTop: 200, paddingBottom: 150 }}>
      <h2 className="font-garamond">{title}</h2>
      <p className="fs-20 mt-10">
         Something went wrong on our side. Please try again — if it keeps happening, contact the Property Planet team.
      </p>
      {error.digest && <p className="fs-14 text-muted">Reference: {error.digest}</p>}
      <div className="d-flex flex-wrap gap-3 mt-30">
         <button type="button" className="btn-four" onClick={reset}>
            Try again
         </button>
         <Link href={homeHref} className="btn-four">
            {homeLabel}
         </Link>
      </div>
   </div>
);
