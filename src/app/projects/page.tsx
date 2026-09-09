import Wrapper from "@/layouts/Wrapper";
import HeaderTwo from "@/layouts/headers/HeaderTwo";
import FooterOne from "@/layouts/footers/FooterOne";
import ProjectsListing from "@/components/projects/ProjectsListing";
import { getPublishedProjects } from "@/lib/projects/queries";

// Always fetch fresh — published inventory changes independently of any
// build, and this route reads through Supabase (RLS-scoped to published
// rows only), not local demo data.
export const dynamic = "force-dynamic";

export const metadata = {
   title: "Projects | Property Planet",
};

const ProjectsPage = async () => {
   const projects = await getPublishedProjects();

   return (
      <Wrapper>
         <HeaderTwo style_1={false} style_2={false} />
         <ProjectsListing items={projects} />
         <FooterOne style={true} />
      </Wrapper>
   );
};

export default ProjectsPage;
