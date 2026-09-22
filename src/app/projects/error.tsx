"use client";

// Phase 27: route-level error boundary for Featured Opportunities. Same
// reasoning as src/app/properties/error.tsx — the raw error is never shown,
// only Next's opaque digest.
//
// Phase 4C: same two issues Phase 4A found and fixed on
// /properties/error.tsx —
//   1. no HeaderTwo/FooterOne shell (this is exactly the state where a
//      visitor most needs a way out and had no header nav to fall back on);
//   2. the "Try again" / "Back to home" actions used the bare `btn-four`
//      class, which elsewhere in this app is the 50x50px icon-only square
//      button — here it was squashing real button text instead of showing
//      it as a normal button.
// Swapped both to the same `pp-card-btn` pair /properties/error.tsx uses.

import Link from "next/link";
import HeaderTwo from "@/layouts/headers/HeaderTwo";
import FooterOne from "@/layouts/footers/FooterOne";

export default function ProjectsError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
   return (
      <>
         <HeaderTwo style_1={false} style_2={false} staticHeader={true} />
         <div className="container" style={{ paddingTop: 200, paddingBottom: 150 }}>
            <h2 className="font-garamond">We couldn&apos;t load these opportunities</h2>
            <p className="fs-20 mt-10">
               Something went wrong on our side. Please try again — if it keeps happening, the team has been notified.
            </p>
            {error.digest && <p className="fs-14 text-muted">Reference: {error.digest}</p>}
            <div className="d-flex flex-wrap gap-3 mt-30">
               <button type="button" className="pp-card-btn pp-card-btn--primary" onClick={reset}>
                  Try again
               </button>
               <Link href="/" className="pp-card-btn pp-card-btn--ghost">
                  Back to home
               </Link>
            </div>
         </div>
         <FooterOne style={true} />
      </>
   );
}
