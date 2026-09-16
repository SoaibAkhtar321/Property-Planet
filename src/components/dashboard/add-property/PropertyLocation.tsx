// Matches properties.city / properties.locality (0002), plus the
// property_location row (exact address + exact_lat/exact_lng —
// 0002/0003). Exact coordinates are required at creation time now: the
// public map on a listing's detail page reads approx_lat/approx_lng from
// property_location, and apply_location_jitter() (0003) only derives
// those from exact_lat/exact_lng on INSERT/UPDATE of a property_location
// row — a listing with no exact coordinates gets no property_location row
// at all, and therefore no map, ever. Collecting them here (instead of
// only on a separate post-creation edit screen) is what stops a listing
// from going live with no location data.
export interface PropertyLocationDefaults {
   city?: string;
   locality?: string;
   locationArea?: string;
   nearbyLandmarks?: string;
   exactAddress?: string;
   exactLat?: number;
   exactLng?: number;
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
            <div className="col-md-12">
               <div className="dash-input-wrapper mb-25">
                  <label htmlFor="exact_address">Full Address*</label>
                  <input
                     id="exact_address"
                     name="exact_address"
                     type="text"
                     defaultValue={defaults?.exactAddress}
                     placeholder="Street, landmark, full postal address"
                     required
                  />
               </div>
            </div>
            <div className="col-md-4">
               <div className="dash-input-wrapper mb-25">
                  <label htmlFor="exact_lat">Latitude*</label>
                  <input
                     id="exact_lat"
                     name="exact_lat"
                     type="number"
                     step="any"
                     min={-90}
                     max={90}
                     defaultValue={defaults?.exactLat}
                     placeholder="e.g. 17.385044"
                     required
                  />
               </div>
            </div>
            <div className="col-md-4">
               <div className="dash-input-wrapper mb-25">
                  <label htmlFor="exact_lng">Longitude*</label>
                  <input
                     id="exact_lng"
                     name="exact_lng"
                     type="number"
                     step="any"
                     min={-180}
                     max={180}
                     defaultValue={defaults?.exactLng}
                     placeholder="e.g. 78.486671"
                     required
                  />
               </div>
            </div>
            <div className="col-md-4">
               <div className="dash-input-wrapper mb-25">
                  <label htmlFor="location_area">Area / Zone</label>
                  <input
                     id="location_area"
                     name="location_area"
                     type="text"
                     defaultValue={defaults?.locationArea}
                     placeholder="Optional — neighbourhood or zone"
                  />
               </div>
            </div>
            <div className="col-md-12">
               <div className="dash-input-wrapper mb-15">
                  <label htmlFor="nearby_landmarks">Nearby Landmarks</label>
                  <input
                     id="nearby_landmarks"
                     name="nearby_landmarks"
                     type="text"
                     defaultValue={defaults?.nearbyLandmarks}
                     placeholder="Optional — e.g. Near City Mall, 2km from Metro Station"
                  />
               </div>
            </div>
         </div>
         <p className="fs-13 opacity-65 mt-10 mb-0">
            The exact address and coordinates are never shown publicly — buyers only ever see a randomized nearby
            point on the map. The real location is used internally and only revealed after a qualifying inquiry.
         </p>
      </div>
   )
}

export default PropertyLocation;
