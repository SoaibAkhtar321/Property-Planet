import Wrapper from "@/layouts/Wrapper";
import HeaderTwo from "@/layouts/headers/HeaderTwo";
import FooterOne from "@/layouts/footers/FooterOne";
import BlogListing from "@/components/blog/BlogListing";
import { getPublishedPosts } from "@/lib/blog/queries";
import { OG_IMAGES, OG_IMAGE_URL } from "@/lib/site/seo";

// Always fetch fresh — published inventory changes independently of any
// build, and this route reads through Supabase (RLS-scoped to published
// rows only, via blog_public), not local demo data. Same reasoning as
// /properties and /projects.
export const dynamic = "force-dynamic";

const CANONICAL = "https://propertyplanet.in/blog";
const DESCRIPTION = "Guidance on buying and selling plots, land and property across Hyderabad's growth corridors.";

export const metadata = {
   title: "Insights | Property Planet",
   description: DESCRIPTION,
   alternates: { canonical: CANONICAL },
   openGraph: {
      title: "Insights | Property Planet",
      description: DESCRIPTION,
      url: CANONICAL,
      type: "website",
      images: OG_IMAGES,
   },
   // SEO fix (Section 20 — Twitter/X Card): see the identical note in
   // src/app/properties/page.tsx — this page had no twitter block either.
   twitter: {
      card: "summary_large_image",
      title: "Insights | Property Planet",
      description: DESCRIPTION,
      images: [OG_IMAGE_URL],
   },
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
