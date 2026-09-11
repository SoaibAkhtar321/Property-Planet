// Only area/bedrooms/bathrooms exist on `properties` (0002). Kitchens,
// garages, garage size, year built, and floors from the original template
// have no backing column and have been dropped rather than faked.
export interface ListingDetailsDefaults {
   area?: number | string | null;
   area_unit?: string | null;
   bedrooms?: number | null;
   bathrooms?: number | null;
}

const ListingDetails = ({ defaults }: { defaults?: ListingDetailsDefaults }) => {
   return (
      <div className="bg-white card-box border-20 mt-40">
         <h4 className="dash-title-three">Listing Details</h4>
         <div className="row align-items-end">
            <div className="col-md-6">
               <div className="dash-input-wrapper mb-30">
                  <label htmlFor="area">Size*</label>
                  <input id="area" name="area" type="number" min={0} step="0.01" defaultValue={defaults?.area ?? undefined} placeholder="Ex: 3210" />
               </div>
            </div>
            <div className="col-md-6">
               <div className="dash-input-wrapper mb-30">
                  <label htmlFor="area_unit">Size Unit</label>
                  <input id="area_unit" name="area_unit" type="text" defaultValue={defaults?.area_unit ?? "sqft"} placeholder="sqft" />
               </div>
            </div>
            <div className="col-md-6">
               <div className="dash-input-wrapper mb-30">
                  <label htmlFor="bedrooms">Bedrooms</label>
                  <input id="bedrooms" name="bedrooms" type="number" min={0} step={1} defaultValue={defaults?.bedrooms ?? undefined} placeholder="0" />
               </div>
            </div>
            <div className="col-md-6">
               <div className="dash-input-wrapper mb-30">
                  <label htmlFor="bathrooms">Bathrooms</label>
                  <input id="bathrooms" name="bathrooms" type="number" min={0} step={1} defaultValue={defaults?.bathrooms ?? undefined} placeholder="0" />
               </div>
            </div>
         </div>
      </div>
   )
}

export default ListingDetails;
