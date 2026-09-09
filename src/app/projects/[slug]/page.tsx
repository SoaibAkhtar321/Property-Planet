import { notFound } from "next/navigation";
import Wrapper from "@/layouts/Wrapper";
import HeaderTwo from "@/layouts/headers/HeaderTwo";
import FooterOne from "@/layouts/footers/FooterOne";
import ProjectDetail from "@/components/projects/ProjectDetail";
import { getProjectBySlug } from "@/lib/projects/queries";

// Same reasoning as /projects: published/unpublished state can change
// independently of any build, and an unpublished or invalid slug must 404
// rather than serve a stale cached page.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { slug: string } }) {
   const project = await getProjectBySlug(params.slug);
   if (!project) {
      return { title: "Project Not Found | Property Planet" };
   }
   return {
      title: project.seoTitle ?? `${project.title} | Property Planet`,
      description: project.seoDescription ?? project.overview ?? undefined,
   };
}

const ProjectDetailPage = async ({ params }: { params: { slug: string } }) => {
   const project = await getProjectBySlug(params.slug);

   // getProjectBySlug reads from project_public, which already filters to
   // status = 'published' — an unpublished slug returns null here exactly
   // like an invalid one, so both correctly 404 rather than leaking draft
   // content.
   if (!project) {
      notFound();
   }

   return (
      <Wrapper>
         <HeaderTwo style_1={false} style_2={false} />
         <ProjectDetail project={project} />
         <FooterOne style={true} />
      </Wrapper>
   );
};

export default ProjectDetailPage;
