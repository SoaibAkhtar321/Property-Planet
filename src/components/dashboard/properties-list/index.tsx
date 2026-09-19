import PropertyListBody from "./PropertyListBody"

// Phase 5 fix: same duplicate-sidebar bug as message/index.tsx -- see that
// file's comment. PropertyListBody already renders DashboardHeaderTwo,
// which renders the real, correctly wired DashboardHeaderOne itself.
const PropertyList = () => {
   return (
      <>
         <PropertyListBody />
      </>
   )
}

export default PropertyList
