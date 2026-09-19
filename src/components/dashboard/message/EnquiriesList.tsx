import Link from "next/link";
import { MyEnquiry, LeadStatus, SiteVisitStatus } from "@/lib/leads/queries";
import CancelSiteVisitButton from "./CancelSiteVisitButton";

const visitStatusLabel: Record<SiteVisitStatus, string> = {
   requested: "Requested",
   confirmed: "Confirmed",
   completed: "Completed",
   cancelled: "Cancelled",
   no_show: "Missed",
};

const formatDateTime = (iso: string) =>
   new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });

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

const EnquiriesList = ({ enquiries }: { enquiries: MyEnquiry[] }) => {
   if (enquiries.length === 0) {
      return (
         <div className="bg-white card-box border-20 p-40 text-center">
            <p className="fs-20 m0">
               You haven&apos;t sent any enquiries yet. Enquire about a property to see it here.
            </p>
         </div>
      );
   }

   return (
      <div className="bg-white card-box border-20">
         <ul className="style-none">
            {enquiries.map((enquiry) => {
               const href = enquiry.propertySlug
                  ? `/properties/${enquiry.propertySlug}`
                  : null;
               const title =
                  enquiry.propertyTitle ??
                  enquiry.projectTitle ??
                  "Listing no longer available";

               return (
                  <li key={enquiry.id} className="bottom-line pb-20 mb-20">
                     <div className="d-sm-flex align-items-center justify-content-between">
                        <div>
                           {href ? (
                              <Link href={href} className="title fw-500 color-dark tran3s">
                                 {title}
                              </Link>
                           ) : (
                              <span className="title fw-500 color-dark">{title}</span>
                           )}
                           <div className="fs-14 mt-5">{formatDate(enquiry.createdAt)}</div>
                        </div>
                        <div className={`property-status ${statusClass[enquiry.status] ?? ""} mt-10 mt-sm-0`}>
                           {statusLabel[enquiry.status]}
                        </div>
                     </div>
                     {enquiry.message && <p className="fs-16 mt-15 mb-0">{enquiry.message}</p>}
                     {enquiry.siteVisits.length > 0 && (
                        <div className="mt-15">
                           <div className="fs-14 fw-500 mb-5">Site visits</div>
                           <ul className="style-none">
                              {enquiry.siteVisits.map((visit) => (
                                 <li
                                    key={visit.id}
                                    className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-5"
                                 >
                                    <span className="fs-14">
                                       {visit.scheduledAt ? formatDateTime(visit.scheduledAt) : "Time to be confirmed"}
                                       {" · "}
                                       {visitStatusLabel[visit.status]}
                                    </span>
                                    {(visit.status === "requested" || visit.status === "confirmed") && (
                                       <CancelSiteVisitButton siteVisitId={visit.id} />
                                    )}
                                 </li>
                              ))}
                           </ul>
                        </div>
                     )}
                  </li>
               );
            })}
         </ul>
      </div>
   );
};

export default EnquiriesList;
