import Link from "next/link";
import PropertyCard from "@/components/properties/PropertyCard";
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

// Two full rows at 3-per-row (PropertyCard is col-lg-4) before the teaser
// falls back to "see more" instead of listing every published property.
// The old pageSize of 3 meant this teaser could only ever show one row —
// publishing a 4th property didn't lose the 3 that came before it (they're
// still published, just not "newest" anymore), it just bumped the oldest
// of the 3 out of a single-row window. Showing 6 gives that window room
// before anything drops off, and `total` (already returned by
// searchPublishedProperties) tells us whether there's more to point to.
const HOMEPAGE_PROPERTY_LIMIT = 6;

const ExploreProperties = async () => {
   const { items, total } = await searchPublishedProperties({
      sort: "newest",
      page: 1,
      pageSize: HOMEPAGE_PROPERTY_LIMIT,
   });
   const hasMore = total > HOMEPAGE_PROPERTY_LIMIT;

   return (
      <div className="property-listing-two position-relative z-1 mt-150 xl-mt-120 pb-150 xl-pb-120 lg-pb-80">
         <div className="container">
            <div className="position-relative">
               <div className="title-one mb-25 lg-mb-20 wow fadeInUp">
                  <h2 className="font-garamond">Explore Properties</h2>
                  <p className="fs-22 mt-xs">
                     Standalone plots, villas, houses and apartments ready to buy or rent — browse independently of our
                     Featured Opportunities projects.
                  </p>
               </div>

               {items.length > 0 ? (
                  <div className="row gx-xxl-5">
                     {items.map((item) => (
                        <PropertyCard key={item.id} item={item} />
                     ))}
                  </div>
               ) : (
                  <p className="fs-20 mt-30">
                     No standalone properties are published yet. Check back soon — new Property Planet listings will
                     appear here as they&apos;re added.
                  </p>
               )}

               {hasMore && (
                  <div className="section-btn text-center md-mt-60">
                     <Link href="/properties" className="btn-eight">
                        <span>See More Properties</span> <i className="bi bi-arrow-up-right"></i>
                     </Link>
                  </div>
               )}
            </div>
         </div>
      </div>
   );
};

export default ExploreProperties;
