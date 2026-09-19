import Link from "next/link";
import { SellerLead } from "@/lib/leads/sellerQueries";
import { LeadStatus } from "@/lib/leads/queries";

const statusLabel: Record<LeadStatus, string> = {
   new: "New",
   contacted: "Contacted",
   qualified: "Qualified",
   site_visit: "Site Visit",
   negotiation: "Negotiation",
   closed: "Closed",
   lost: "Lost",
};

const statusClass: Record<LeadStatus, string | undefined> = {
   new: "pending",
   contacted: "pending",
   qualified: undefined,
   site_visit: undefined,
   negotiation: undefined,
   closed: undefined,
   lost: "processing",
};

const formatDate = (iso: string) =>
   new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

/**
 * Seller view of buyer enquiries on their own properties. Shows who
 * enquired (name), about which property, when, and the status/message --
 * never the buyer's phone or email. Those fields are not sent to this
 * component at all: they are excluded by the `seller_leads` database view
 * (0029), so this is not a UI-level hide.
 */
const SellerLeadsList = ({ leads }: { leads: SellerLead[] }) => {
   return (
      <div className="mb-40">
         <div className="d-flex align-items-center justify-content-between mb-20">
            <h4 className="dash-title-three m0">
               Leads on my properties ({leads.length} {leads.length === 1 ? "Lead" : "Leads"})
            </h4>
         </div>

         <div className="bg-white card-box border-20">
            <p className="fs-15 mb-25">
               Buyers who enquire about your properties are received by the Property Planet team. You can see
               who enquired and about which property; buyer contact details are handled by our team and are not
               shared directly. We will coordinate with you on next steps.
            </p>

            {leads.length === 0 ? (
               <p className="fs-18 m0 text-center">
                  No enquiries on your properties yet. New leads will appear here.
               </p>
            ) : (
               <ul className="style-none">
                  {leads.map((lead) => (
                     <li key={lead.id} className="bottom-line pb-20 mb-20">
                        <div className="d-sm-flex align-items-center justify-content-between">
                           <div>
                              <span className="title fw-500 color-dark">{lead.buyerName}</span>
                              <span className="fs-15"> enquired about </span>
                              {lead.propertySlug ? (
                                 <Link
                                    href={`/properties/${lead.propertySlug}`}
                                    className="title fw-500 color-dark tran3s"
                                 >
                                    {lead.propertyTitle}
                                 </Link>
                              ) : (
                                 <span className="title fw-500 color-dark">{lead.propertyTitle}</span>
                              )}
                              <div className="fs-14 mt-5">{formatDate(lead.createdAt)}</div>
                           </div>
                           <div className={`property-status ${statusClass[lead.status] ?? ""} mt-10 mt-sm-0`}>
                              {statusLabel[lead.status]}
                           </div>
                        </div>
                        {lead.message && <p className="fs-16 mt-15 mb-0">{lead.message}</p>}
                     </li>
                  ))}
               </ul>
            )}
         </div>
      </div>
   );
};

export default SellerLeadsList;
