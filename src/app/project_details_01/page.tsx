import ProjectDetails from "@/components/inner-pages/projects/project-details";
import Wrapper from "@/layouts/Wrapper";

export const metadata = {
   title: "Property Planet — Project Details",
};
const index = () => {
   return (
      <Wrapper>
         <ProjectDetails />
      </Wrapper>
   )
}

export default index