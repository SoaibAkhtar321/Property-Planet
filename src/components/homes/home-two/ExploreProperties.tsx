import Link from "next/link";
import PropertyGridWithToggle from "@/components/properties/PropertyGridWithToggle";
import { searchPublishedProperties } from "@/lib/properties/queries";

// Batch 3: the homepage's counterpart to Property.tsx ("Featured
// Opportunities" / Projects). Reuses the same public discovery query and
// invariant as /properties (searchPublishedProperties -> property_public,
// `project_id is null`), so a Project Unit can never surface here even
// though this teaser fetches by "newest published" rather than any filter
// a buyer chose. No new query, no new card — same pattern as Property.tsx
// reusing getFeaturedProjects()/ProjectCard.
//
// "Explore Properties" is not a new name invented for this batch: it is
// the site's own existing language for this exact destination — see the
// hero CTA in HeroBanner.tsx, which already links to /properties with
// that label. Using it here keeps one consistent name across the hero,
// this section, and the /properties page itself, pairing with "Featured
// Opportunities" as the two public discovery routes.
export const dynamic = "force-dynamic";

// Same reveal pattern as "Explore the Places with Most Properties"
// (BLockFeatureOne): 4 per row, 2 rows (8) visible by default, then an
// in-place "See More" toggle instead of a link away. searchPublishedProperties
// caps pageSize at 60, so that's what's fetched up front and handed to the
// client toggle grid — no per-click request. If there's ever more than
// that fetched cap (checked against `total`), a plain link to the full
// /properties page covers the remainder.
const HOMEPAGE_PROPERTY_FETCH_LIMIT = 60;

const ExploreProperties = async () => {
   const { items, total } = await searchPublishedProperties({
      sort: "newest",
      page: 1,
      pageSize: HOMEPAGE_PROPERTY_FETCH_LIMIT,
   });
   const hasMoreBeyondFetch = total > items.length;

   return (
      // {/* No top margin here: the preceding "Featured Opportunities" section
      //     already ends in pb-150 (xl-pb-120 / lg-pb-80). Stacking mt-150 on
      //     top of that was doubling the gap between the two sections on both
      //     desktop and mobile. */}
      <div className="property-listing-two pp-band pp-band--sky">
                  <div className="container">
            <div className="position-relative">
               <div className="title-one mb-25 lg-mb-20 wow fadeInUp">
                  <h2 className="font-garamond fs-lg">Explore Properties</h2>
                  <p className="fs-22 mt-xs">
                     Standalone plots, villas, houses and apartments ready to buy — browse independently of our
                     Featured Opportunities projects.
                  </p>
               </div>

               {items.length > 0 ? (
                  <PropertyGridWithToggle items={items} />
               ) : (
                  /* Same card treatment as the empty "Featured Opportunities"
                     state above, plus the two things a visitor can actually
                     do right now: list a property, or ask the team. */
                  <div className="pp-how pp-empty-card text-center py-5 mt-30">
                     <span className="pp-empty-card__icon" aria-hidden="true"><i className="bi bi-house-add"></i></span>
                     <h5 className="mb-10">New listings are on the way</h5>
                     <p className="fs-18 mb-25 opacity-75">
                        Standalone plots, villas and homes appear here as soon as our team approves them.
                        Own one? List it free — or tell us what you&apos;re looking for.
                     </p>
                     <div className="d-flex flex-wrap justify-content-center gap-2">
                        <Link href="/seller/login" className="pp-card-btn pp-card-btn--primary d-inline-flex px-4">
                           List your property
                        </Link>
                        <Link href="/contact" className="pp-card-btn d-inline-flex px-4">
                           Tell us what you need
                        </Link>
                     </div>
                  </div>
               )}

               {hasMoreBeyondFetch && (
                  // Not "section-btn": that class is styled by
                  // `.property-listing-two .section-btn` (position: absolute;
                  // top: 65px; right: 0) in _listing.scss, meant for a button
                  // sitting inline next to a section title (see Property.tsx's
                  // header). This CTA sits below the whole grid instead, so
                  // inheriting that rule pulled it out of flow and stacked it
                  // on top of the cards/title above -- the "Explore Property
                  // section has incorrect top padding/spacing/positioning"
                  // bug. Blog.tsx avoids this same collision by living inside
                  // a differently-scoped section (`.blog-section-one`); here
                  // we just use a plain in-flow class instead.
                  <div className="pp-section-cta text-center md-mt-60">
                     <Link href="/properties" className="btn-eight">
                        <span>Browse All Properties</span> <i className="bi bi-arrow-up-right"></i>
                     </Link>
                  </div>
               )}
            </div>
         </div>
      </div>
   );
};

export default ExploreProperties;
