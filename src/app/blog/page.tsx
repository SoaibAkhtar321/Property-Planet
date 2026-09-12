import Wrapper from "@/layouts/Wrapper";
import HeaderTwo from "@/layouts/headers/HeaderTwo";
import FooterOne from "@/layouts/footers/FooterOne";
import BlogListing from "@/components/blog/BlogListing";
import { getPublishedPosts } from "@/lib/blog/queries";

// Always fetch fresh — published inventory changes independently of any
// build, and this route reads through Supabase (RLS-scoped to published
// rows only, via blog_public), not local demo data. Same reasoning as
// /properties and /projects.
export const dynamic = "force-dynamic";

export const metadata = {
   title: "Insights | Property Planet",
   description: "Guidance on buying and selling plots, land and property across Hyderabad's growth corridors.",
};

const BlogPage = async () => {
   const posts = await getPublishedPosts();

   return (
      <Wrapper>
         <HeaderTwo style_1={false} style_2={false} />
         <BlogListing items={posts} />
         <FooterOne style={true} />
      </Wrapper>
   );
};

export default BlogPage;
