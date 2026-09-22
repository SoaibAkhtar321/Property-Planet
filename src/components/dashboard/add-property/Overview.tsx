"use client"
import { useState } from "react";
import NiceSelect from "@/ui/NiceSelect";
import { PRICE_UNIT_OPTIONS, PriceUnit } from "@/lib/properties/priceUnit";

// Fields map 1:1 to `properties` columns (0002_properties_and_location.sql).
// No fabricated fields: "Yearly Tax Rate" etc. from the original template
// had no backing column and has been dropped, not faked.
//
// NiceSelect renders a decorative <div>, not a real <select> — it has no
// `name` attribute and doesn't participate in native FormData submission.
// So property_type/listing_type are tracked in local state and mirrored
// into hidden inputs, which is what the enclosing <form action={...}> (in
// AddPropertyBody / EditPropertyBody) actually reads.
export interface OverviewDefaults {
   title?: string;
   description?: string | null;
   property_type?: string;
   listing_type?: string;
   price?: number | string;
   price_unit?: string | null;
   price_unit_label?: string | null;
}

// Plot listed first: Property Planet is primarily a plot/land marketplace,
// with villas and apartments supported as secondary categories.
const propertyTypeOptions = [
   { value: "plot", text: "Plot / Land" },
   { value: "villa", text: "Villa" },
   { value: "apartment", text: "Apartment" },
   { value: "commercial", text: "Commercial" },
];

const Overview = ({ defaults }: { defaults?: OverviewDefaults }) => {
   const [propertyType, setPropertyType] = useState(defaults?.property_type ?? "plot");
   const propertyTypeIndex = Math.max(0, propertyTypeOptions.findIndex((o) => o.value === propertyType));

   // Price-unit (0033_property_price_unit.sql). A brand-new listing (no
   // `defaults` at all) defaults to the first/preferred option, sqft. An
   // existing listing being edited that has no stored unit yet (pre-migration
   // row) defaults the widget to "Total Property Price" -- the option whose
   // display is identical to today's unlabeled price -- rather than silently
   // pre-selecting sqft, which would misrepresent what the stored price means
   // until the seller/admin actually saves.
   const initialUnit = (defaults?.price_unit as PriceUnit) || (defaults ? "total" : "sqft");
   const [priceUnit, setPriceUnit] = useState<PriceUnit>(initialUnit);
   const priceUnitIndex = Math.max(0, PRICE_UNIT_OPTIONS.findIndex((o) => o.value === priceUnit));

   return (
      <div className="bg-white card-box border-20">
         <h4 className="dash-title-three">Overview</h4>
         <div className="dash-input-wrapper mb-30">
            <label htmlFor="title">Property Title*</label>
            <input id="title" name="title" type="text" defaultValue={defaults?.title} placeholder="Your Property Name" required minLength={3} maxLength={200} />
         </div>
         <div className="dash-input-wrapper mb-30">
            <label htmlFor="description">Description</label>
            <textarea id="description" name="description" className="size-lg" defaultValue={defaults?.description ?? ""} placeholder="Write about property..."></textarea>
         </div>
         <div className="row align-items-end">
            <div className="col-md-6">
               <div className="dash-input-wrapper mb-30">
                  <label htmlFor="property_type">Category*</label>
                  <input type="hidden" name="property_type" value={propertyType} />
                  <NiceSelect
                     className="nice-select"
                     options={propertyTypeOptions}
                     defaultCurrent={propertyTypeIndex}
                     onChange={(e) => setPropertyType(e.target.value)}
                     name="property_type"
                     placeholder=""
                  />
               </div>
            </div>
            {/* Phase 20: the "Listed in" Sale/Rent control is removed —
                Property Planet lists property for sale only, so a seller can
                no longer create unsupported rental inventory. The server
                actions hardcode listing_type: "sale" too, so removing the
                control is not the only protection. */}
            <div className="col-md-6">
               <div className="dash-input-wrapper mb-30">
                  <label htmlFor="price">Price*</label>
                  <input id="price" name="price" type="number" min={0} step="0.01" defaultValue={defaults?.price} placeholder="Your Price" required />
               </div>
            </div>
         </div>
         <div className="row align-items-end">
            <div className="col-md-6">
               <div className="dash-input-wrapper mb-30">
                  <label htmlFor="price_unit">Price Unit*</label>
                  <input type="hidden" name="price_unit" value={priceUnit} />
                  <NiceSelect
                     className="nice-select"
                     options={PRICE_UNIT_OPTIONS}
                     defaultCurrent={priceUnitIndex}
                     onChange={(e) => setPriceUnit(e.target.value as PriceUnit)}
                     name="price_unit"
                     placeholder=""
                  />
               </div>
            </div>
            {priceUnit === "custom" && (
               <div className="col-md-6">
                  <div className="dash-input-wrapper mb-30">
                     <label htmlFor="price_unit_label">Custom Unit Label*</label>
                     <input
                        id="price_unit_label"
                        name="price_unit_label"
                        type="text"
                        defaultValue={defaults?.price_unit_label ?? ""}
                        placeholder="e.g. per guntha"
                        maxLength={40}
                        required
                     />
                  </div>
               </div>
            )}
         </div>
      </div>
   )
}

export default Overview;
