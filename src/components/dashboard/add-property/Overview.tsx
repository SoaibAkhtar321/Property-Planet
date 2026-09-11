"use client"
import { useState } from "react";
import NiceSelect from "@/ui/NiceSelect";

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
}

const propertyTypeOptions = [
   { value: "apartment", text: "Apartment" },
   { value: "villa", text: "Villa" },
   { value: "plot", text: "Plot" },
   { value: "commercial", text: "Commercial" },
];
const listingTypeOptions = [
   { value: "sale", text: "Sale" },
   { value: "rent", text: "Rent" },
];

const Overview = ({ defaults }: { defaults?: OverviewDefaults }) => {
   const [propertyType, setPropertyType] = useState(defaults?.property_type ?? "apartment");
   const [listingType, setListingType] = useState(defaults?.listing_type ?? "sale");
   const propertyTypeIndex = Math.max(0, propertyTypeOptions.findIndex((o) => o.value === propertyType));
   const listingTypeIndex = Math.max(0, listingTypeOptions.findIndex((o) => o.value === listingType));

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
            <div className="col-md-6">
               <div className="dash-input-wrapper mb-30">
                  <label htmlFor="listing_type">Listed in*</label>
                  <input type="hidden" name="listing_type" value={listingType} />
                  <NiceSelect
                     className="nice-select"
                     options={listingTypeOptions}
                     defaultCurrent={listingTypeIndex}
                     onChange={(e) => setListingType(e.target.value)}
                     name="listing_type"
                     placeholder=""
                  />
               </div>
            </div>
            <div className="col-md-6">
               <div className="dash-input-wrapper mb-30">
                  <label htmlFor="price">Price*</label>
                  <input id="price" name="price" type="number" min={0} step="0.01" defaultValue={defaults?.price} placeholder="Your Price" required />
               </div>
            </div>
         </div>
      </div>
   )
}

export default Overview;
