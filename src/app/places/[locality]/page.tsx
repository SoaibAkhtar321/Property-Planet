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

const PlacePage = async ({ params }: { params: { locality: string } }) => {
   const place = decodeURIComponent(params.locality).trim();
   if (!place) notFound();

   const [properties, projects] = await Promise.all([getPropertiesForPlace(place), getProjectsForPlace(place)]);

   return (
      <Wrapper>
         <HeaderTwo style_1={false} style_2={false} />
         <div className="property-listing-six bg-pink-two pt-110 md-pt-80 pb-150 xl-pb-120 mt-150 xl-mt-120">
            <div className="container container-large">
               <div className="row">
                  <div className="col-xl-9">
                     <div className="mb-40 lg-mb-30">
                        <h2 className="font-garamond">Properties in {place}</h2>
                        <p className="fs-18 mt-10 mb-0">
                           Standalone properties and projects published for this area. Looking for everything on the
                           site instead? <Link href="/properties">Browse all properties</Link> or{" "}
                           <Link href="/projects">see all featured opportunities</Link>.
                        </p>
                     </div>

                     {properties.length === 0 && projects.length === 0 && (
                        <p className="fs-20">
                           Nothing is published for {place} yet. Check back soon, or{" "}
                           <Link href="/properties">browse individual properties</Link> across every area.
                        </p>
                     )}

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
