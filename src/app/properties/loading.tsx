// Phase 27: shown while the server component fetches. Matches the listing's
// own spacing so the page doesn't jump when the real content arrives.
//
// Phase 4A: HeaderTwo/FooterOne live inside page.tsx's own JSX, not the
// root layout, so this route-level loading boundary was rendering with no
// header or footer at all -- a real navigation dead-end mid-fetch on a
// page a visitor could easily land on directly (e.g. a shared /properties
// link). Wrapping it in the same header/footer shell as the loaded page.
import HeaderTwo from "@/layouts/headers/HeaderTwo";
import FooterOne from "@/layouts/footers/FooterOne";

export default function PropertiesLoading() {
   return (
      <>
         <HeaderTwo style_1={false} style_2={false} staticHeader={true} />
         <div className="container" style={{ paddingTop: 200, paddingBottom: 150 }} aria-busy="true">
            <p className="fs-20" role="status">
               Loading properties…
            </p>
         </div>
         <FooterOne style={true} />
      </>
   );
}
