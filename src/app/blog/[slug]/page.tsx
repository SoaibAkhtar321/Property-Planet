import { notFound } from "next/navigation";
import Wrapper from "@/layouts/Wrapper";
import HeaderTwo from "@/layouts/headers/HeaderTwo";
import FooterOne from "@/layouts/footers/FooterOne";
import BlogDetail from "@/components/blog/BlogDetail";
import { getPostBySlug, getOtherPublishedPosts } from "@/lib/blog/queries";

// Same reasoning as /blog and /properties/[slug]: published/unpublished
// state can change independently of any build, and an unpublished or
// invalid slug must 404 rather than serve a stale cached page.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { slug: string } }) {
   const post = await getPostBySlug(params.slug);
   if (!post) {
      return { title: "Article Not Found | Property Planet" };
   }
   return {
      title: post.seoTitle ?? `${post.title} | Property Planet`,
      description: post.seoDescription ?? post.excerpt ?? undefined,
      openGraph: {
         title: post.seoTitle ?? post.title,
         description: post.seoDescription ?? post.excerpt ?? undefined,
         images: post.ogImageUrl ? [post.ogImageUrl] : undefined,
      },
   };
}

const BlogDetailPage = async ({ params }: { params: { slug: string } }) => {
   const post = await getPostBySlug(params.slug);

   // getPostBySlug reads from blog_public, which already filters to
   // status = 'published' — an unpublished slug returns null here exactly
   // like an invalid one, so both correctly 404 rather than leaking draft
   // content.
   if (!post) {
      notFound();
   }

   const otherPosts = await getOtherPublishedPosts(post.id, 3);

   return (
      <Wrapper>
         <HeaderTwo style_1={false} style_2={false} />
         <BlogDetail post={post} otherPosts={otherPosts} />
         <FooterOne style={true} />
      </Wrapper>
   );
};

export default BlogDetailPage;
