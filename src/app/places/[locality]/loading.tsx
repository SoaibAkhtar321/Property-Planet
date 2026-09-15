// Shown while the server component fetches. Matches the listing's own
// spacing so the page doesn't jump when the real content arrives — same
// convention as src/app/properties/loading.tsx.
export default function PlaceLoading() {
   return (
      <div className="container" style={{ paddingTop: 200, paddingBottom: 150 }} aria-busy="true">
         <p className="fs-20" role="status">
            Loading properties…
         </p>
      </div>
   );
}
