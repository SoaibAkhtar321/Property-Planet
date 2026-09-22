import Wrapper from "@/layouts/Wrapper";
import HeaderTwo from "@/layouts/headers/HeaderTwo";
import FooterOne from "@/layouts/footers/FooterOne";
import ProjectsListing from "@/components/projects/ProjectsListing";
import { getPublishedProjects } from "@/lib/projects/queries";
import { OG_IMAGES, OG_IMAGE_URL } from "@/lib/site/seo";

// Always fetch fresh — published inventory changes independently of any
// build, and this route reads through Supabase (RLS-scoped to published
// rows only), not local demo data.
export const dynamic = "force-dynamic";

const CANONICAL = "https://propertyplanet.in/projects";
const DESCRIPTION =
   "Featured Opportunities from Property Planet — larger developments and projects across Hyderabad and the Future City corridor, each with individual units and plots available.";

export const metadata = {
   title: "Featured Opportunities | Property Planet",
   description: DESCRIPTION,
   alternates: { canonical: CANONICAL },
   openGraph: {
      title: "Featured Opportunities | Property Planet",
      description: DESCRIPTION,
      url: CANONICAL,
      type: "website",
      images: OG_IMAGES,
      siteName: "Property Planet",
   },
   // SEO fix (Section 20 — Twitter/X Card): see the identical note in
   // src/app/properties/page.tsx — this page had no twitter block either.
   twitter: {
      card: "summary_large_image",
      title: "Featured Opportunities | Property Planet",
      description: DESCRIPTION,
      images: [OG_IMAGE_URL],
   },
};

const ProjectsPage = async () => {
   const projects = await getPublishedProjects();

   return (
      <Wrapper>
         <HeaderTwo style_1={false} style_2={false} staticHeader={true} />
         <ProjectsListing items={projects} />
         <FooterOne style={true} />
      </Wrapper>
   );
};

export default ProjectsPage;
