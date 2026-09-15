// Phase 27: shown while the server component fetches. Matches the listing's
// own spacing so the page doesn't jump when the real content arrives.
export default function PropertiesLoading() {
   return (
      <div className="container" style={{ paddingTop: 200, paddingBottom: 150 }} aria-busy="true">
         <p className="fs-20" role="status">
            Loading properties…
         </p>
      </div>
   );
}
