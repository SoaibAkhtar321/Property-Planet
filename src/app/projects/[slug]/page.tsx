import { notFound } from "next/navigation";
import Wrapper from "@/layouts/Wrapper";
import HeaderTwo from "@/layouts/headers/HeaderTwo";
import FooterOne from "@/layouts/footers/FooterOne";
import ProjectDetail from "@/components/projects/ProjectDetail";
import demoProjects from "@/components/projects/data/demoProjects";

export function generateMetadata({ params }: { params: { slug: string } }) {
   const project = demoProjects.find((item) => item.slug === params.slug);
   return {
      title: project ? `${project.title} | Property Planet` : "Project Not Found | Property Planet",
   };
}

const ProjectDetailPage = ({ params }: { params: { slug: string } }) => {
   const project = demoProjects.find((item) => item.slug === params.slug);

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
