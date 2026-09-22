"use client";

// Phase 27: a route-level error boundary for the listing. Next renders this
// instead of an unstyled crash screen when the server component throws.
//
// The `error` object is deliberately never rendered: in production it may
// carry a database message or internal path. The digest is shown instead,
// which is the opaque id Next generates and the only thing useful for
// correlating with server logs.

import Link from "next/link";
// Phase 4A: same missing-shell issue as loading.tsx (HeaderTwo/FooterOne
// live in page.tsx, not the root layout) -- particularly bad here, since
// this is the one state where a visitor most needs a way out and had no
// header nav to fall back on if the "Back to home" button didn't work.
// Also fixes the same .btn-four misuse as PropertyFilters.tsx: a 50x50px
// icon-only square class was squashing "Back to home" instead of showing
// it as a normal text button.
import HeaderTwo from "@/layouts/headers/HeaderTwo";
import FooterOne from "@/layouts/footers/FooterOne";

export default function PropertiesError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
   return (
      <>
         <HeaderTwo style_1={false} style_2={false} staticHeader={true} />
         <div className="container" style={{ paddingTop: 200, paddingBottom: 150 }}>
            <h2 className="font-garamond">We couldn&apos;t load these properties</h2>
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
