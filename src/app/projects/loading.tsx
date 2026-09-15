// Phase 27: shown while the project list/detail data is fetched.
export default function ProjectsLoading() {
   return (
      <div className="container" style={{ paddingTop: 200, paddingBottom: 150 }} aria-busy="true">
         <p className="fs-20" role="status">
            Loading featured opportunities…
         </p>
      </div>
   );
}
