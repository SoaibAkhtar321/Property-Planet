import Wrapper from "@/layouts/Wrapper";
import HeaderTwo from "@/layouts/headers/HeaderTwo";
import FooterOne from "@/layouts/footers/FooterOne";
import ProjectsListing from "@/components/projects/ProjectsListing";

export const metadata = {
   title: "Projects | Property Planet",
};

const ProjectsPage = () => {
   return (
      <Wrapper>
         <HeaderTwo style_1={false} style_2={false} />
         <ProjectsListing />
         <FooterOne style={true} />
      </Wrapper>
   );
};

export default ProjectsPage;
