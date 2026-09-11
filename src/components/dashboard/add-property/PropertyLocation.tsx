// Matches properties.city / properties.locality (0002). The richer
// property_location table (exact/approx lat-lng, nearby_landmarks —
// 0002/0003) is deliberately not wired here: the brief's Phase 2 scope
// is the listing workflow + status security fix, not the map-jitter
// location flow, and adding those fields without the jitter/reveal
// logic behind them would be half-built rather than a real feature.
export interface PropertyLocationDefaults {
   city?: string;
   locality?: string;
}

const PropertyLocation = ({ defaults }: { defaults?: PropertyLocationDefaults }) => {
   return (
      <div className="bg-white card-box border-20 mt-40">
         <h4 className="dash-title-three">Address & Location</h4>
         <div className="row">
            <div className="col-md-6">
               <div className="dash-input-wrapper mb-25">
                  <label htmlFor="city">City*</label>
                  <input id="city" name="city" type="text" defaultValue={defaults?.city} placeholder="City" required />
               </div>
            </div>
            <div className="col-md-6">
               <div className="dash-input-wrapper mb-25">
                  <label htmlFor="locality">Locality*</label>
                  <input id="locality" name="locality" type="text" defaultValue={defaults?.locality} placeholder="Locality / Area" required />
               </div>
            </div>
         </div>
      </div>
   )
}

export default PropertyLocation;
