import Image from "next/image";
import Link from "next/link";
import { Project } from "./data/types";
import InquiryButton from "@/components/inquiry/InquiryButton";

// Phase 20: the project card was visibly a different product from the
// property card — different image treatment, different proportions,
// different typography, a lone circular arrow for a CTA. It now uses the
// same .pp-card shell as PropertyCard so both read as one design system,
// while keeping what is genuinely project-specific: developer, project
// type and live unit availability.
//
// Actions match the property card exactly: See Details + Send Inquiry.
// Send Inquiry opens the same universal dialog and files through the same
// existing lead action (createProjectInquiry), so a project enquiry lands
// in Admin -> Leads with project_id set and property_id NULL — no second
// enquiry architecture.

const ProjectCard = ({ item }: { item: Project }) => {
   const availability =
      item.unitCounts && item.unitCounts.totalUnits > 0
         ? item.unitCounts.availableUnits > 0
            ? `${item.unitCounts.availableUnits} of ${item.unitCounts.totalUnits} units available`
            : "Fully booked"
         : null;

   const detailLine = [item.developer, item.projectType].filter(Boolean).join(" · ");

   return (
      <div className="pp-card pp-card--project h-100 w-100 mb-30 wow fadeInUp">
         <div className="pp-card__media">
            {item.tag && <span className="pp-card__tag">{item.tag}</span>}
            <Link href={`/projects/${item.slug}`} className="pp-card__media-link" tabIndex={-1} aria-hidden="true">
               {item.images[0] ? (
                  <Image
                     src={item.images[0]}
                     alt={item.location ? `${item.title} — ${item.location}` : item.title}
                     width={700}
                     height={525}
                     className="pp-card__img"
                  />
               ) : (
                  <span className="pp-card__img pp-card__img--empty">Photos coming soon</span>
               )}
            </Link>
         </div>

         <div className="pp-card__body">
            <Link href={`/projects/${item.slug}`} className="pp-card__title">
               {item.title}
            </Link>
            {item.location && <p className="pp-card__meta">{item.location}</p>}

            {(detailLine || availability) && (
               <div className="pp-card__facts">
                  {detailLine && <span className="pp-card__type">{detailLine}</span>}
                  {availability && <span>{availability}</span>}
               </div>
            )}

            <div className="pp-card__actions pp-card__actions--project">
               <Link
                  href={`/projects/${item.slug}`}
                  className="pp-card-btn pp-card-btn--ghost"
                  aria-label={`See details for ${item.title}`}
               >
                  See Details
               </Link>
               <InquiryButton kind="project" id={item.id} title={item.title} subtitle={item.location} />
            </div>
         </div>
      </div>
   );
};

export default ProjectCard;
