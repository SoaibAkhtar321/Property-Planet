import Link from "next/link";
import { ProjectUnit } from "../data/types";

// Units / Plots list on the public project detail page.
//
// Each row links to the unit's existing property detail page —
// /properties/[slug] — which is where enquiry, media, map and the existing
// location-privacy rules already live. No enquiry UI and no second unit
// detail architecture is introduced here.
//
// Availability comes from the existing property_status enum and nothing
// else: `property_public` is published-only, so every unit that reaches
// this component is on the market. A sold or draft unit is structurally
// absent from the list rather than rendered with an invented status — the
// counts below are what tell the buyer some units are gone.

const formatPrice = (unit: ProjectUnit) => {
   if (unit.price === undefined) return "Price on request";
   const amount = `₹${unit.price.toLocaleString("en-IN")}`;
   return unit.listingType === "Rent" ? `${amount}/mo` : amount;
};

const Units = ({
   units,
   unitCounts,
}: {
   units: ProjectUnit[];
   unitCounts?: { totalUnits: number; availableUnits: number } | null;
}) => {
   const hasUnitsOnRecord = Boolean(unitCounts && unitCounts.totalUnits > 0);

   // Nothing to say at all: the project genuinely has no units yet.
   if (units.length === 0 && !hasUnitsOnRecord) return null;

   return (
      <section className="row mt-80 lg-mt-50" aria-labelledby="project-units-heading">
         <div className="col-lg-10 mx-auto">
            <div className="d-sm-flex justify-content-between align-items-center mb-30">
               <h4 id="project-units-heading" className="m0">
                  Units &amp; Plots
               </h4>
               {unitCounts && unitCounts.totalUnits > 0 && (
                  <div className="fs-16 mt-10 mt-sm-0">
                     {unitCounts.availableUnits} of {unitCounts.totalUnits} available
                  </div>
               )}
            </div>

            {units.length === 0 ? (
               <p className="fs-20">
                  Every unit in this project is currently sold or off the market.{" "}
                  <Link href="#project-enquiry">Send an enquiry</Link> and the team will let you know as soon as
                  inventory opens up.
               </p>
            ) : (
               <div className="table-responsive">
                  <table className="table property-table align-middle">
                     <caption className="visually-hidden">
                        Available units and plots in this project, with size, price and availability
                     </caption>
                     <thead>
                        <tr>
                           <th scope="col">Unit</th>
                           <th scope="col">Type</th>
                           <th scope="col">Size</th>
                           <th scope="col">Price</th>
                           <th scope="col">Availability</th>
                           <th scope="col">
                              <span className="visually-hidden">Actions</span>
                           </th>
                        </tr>
                     </thead>
                     <tbody>
                        {units.map((unit) => (
                           <tr key={unit.id}>
                              <th scope="row" className="fw-500">
                                 <Link href={`/properties/${unit.slug}`} className="color-dark">
                                    {unit.title}
                                 </Link>
                              </th>
                              <td>{unit.unitType ?? "—"}</td>
                              <td>{unit.area !== undefined ? `${unit.area} ${unit.areaUnit ?? "sqft"}` : "—"}</td>
                              <td>{formatPrice(unit)}</td>
                              <td>
                                 <span className="badge bg-success">{unit.availability}</span>
                              </td>
                              <td className="text-nowrap">
                                 <Link
                                    href={`/properties/${unit.slug}`}
                                    className="fw-500"
                                    aria-label={`View and enquire about ${unit.title}`}
                                 >
                                    View &amp; enquire
                                    <i className="bi bi-arrow-up-right ms-1" aria-hidden="true"></i>
                                 </Link>
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            )}
         </div>
      </section>
   );
};

export default Units;
