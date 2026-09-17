import Link from "next/link";
import { notFound } from "next/navigation";
import Wrapper from "@/layouts/Wrapper";
import HeaderTwo from "@/layouts/headers/HeaderTwo";
import FooterOne from "@/layouts/footers/FooterOne";
import PropertyCard from "@/components/properties/PropertyCard";
import ProjectCard from "@/components/projects/ProjectCard";
import { getPropertiesForPlace } from "@/lib/properties/queries";
import { getProjectsForPlace } from "@/lib/projects/queries";

// Always fetch fresh, same reasoning as /properties and /projects: this
// reads live published inventory through Supabase, not build-time data.
export const dynamic = "force-dynamic";

// SEO fix: `locality` is free-text (see sitemap.ts's own comment on why
// there's no canonical locality table), so this route previously
// returned a 200 "Nothing is published for {place} yet" page for *any*
// arbitrary string in the URL -- an unbounded set of indexable, empty,
// near-duplicate pages. Now it 404s like every other not-found record in
// the app (properties/[slug], projects/[slug], blog/[slug]) when there's
// nothing to show. It still isn't a curated locality page (no canonical
// list of valid localities exists yet -- see the audit's note under
// "Needs a Business Decision"), so it also isn't in sitemap.ts and has
// no metadataBase-quality title/description of its own beyond this
// generateMetadata -- both intentionally deferred until that's decided.
export async function generateMetadata({ params }: { params: { locality: string } }) {
   const place = decodeURIComponent(params.locality).trim();
   if (!place) {
      return { title: "Not Found | Property Planet" };
   }
   return {
      title: `Properties in ${place}, Hyderabad | Property Planet`,
      description: `Browse published properties and projects in ${place}, Hyderabad with Property Planet.`,
   };
}

const PlacePage = async ({ params }: { params: { locality: string } }) => {
   const place = decodeURIComponent(params.locality).trim();
   if (!place) notFound();

   const [properties, projects] = await Promise.all([getPropertiesForPlace(place), getProjectsForPlace(place)]);

   if (properties.length === 0 && projects.length === 0) {
      notFound();
   }

   return (
      <Wrapper>
         <HeaderTwo style_1={false} style_2={false} />
         <div className="property-listing-six bg-pink-two pt-110 md-pt-80 pb-150 xl-pb-120 mt-150 xl-mt-120">
            <div className="container container-large">
               <div className="row">
                  <div className="col-xl-9">
                     <div className="mb-40 lg-mb-30">
                        {/* SEO fix (Section 17 — Heading Structure): this was an <h2>,
                            leaving the page with no <h1> at all. */}
                        <h1 className="font-garamond">Properties in {place}</h1>
                        <p className="fs-18 mt-10 mb-0">
                           Standalone properties and projects published for this area. Looking for everything on the
                           site instead? <Link href="/properties">Browse all properties</Link> or{" "}
                           <Link href="/projects">see all featured opportunities</Link>.
                        </p>
                     </div>

                     {properties.length > 0 && (
                        <div className="mb-60 lg-mb-40">
                           <h4 className="font-garamond mb-25">Properties in {place}</h4>
                           <div className="row gx-xxl-5">
                              {properties.map((item) => (
                                 <PropertyCard key={item.id} item={item} />
                              ))}
                           </div>
                        </div>
                     )}

                     {projects.length > 0 && (
                        <div>
                           <h4 className="font-garamond mb-25">Projects in {place}</h4>
                           <div id="canonical-projects-grid" className="grid-2column pt-10">
                              {projects.map((item) => (
                                 <ProjectCard key={item.id} item={item} />
                              ))}
                           </div>
                        </div>
                     )}
                  </div>
               </div>
            </div>
         </div>
         <FooterOne style={true} />
      </Wrapper>
   );
};

export default PlacePage;
