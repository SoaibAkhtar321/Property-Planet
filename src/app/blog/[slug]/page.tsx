import { notFound } from "next/navigation";
import Wrapper from "@/layouts/Wrapper";
import HeaderTwo from "@/layouts/headers/HeaderTwo";
import FooterOne from "@/layouts/footers/FooterOne";
import BlogDetail from "@/components/blog/BlogDetail";
import ArticleJsonLd from "@/components/common/seo/ArticleJsonLd";
import BreadcrumbJsonLd from "@/components/common/seo/BreadcrumbJsonLd";
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
   const title = post.seoTitle ?? `${post.title} | Property Planet`;
   const description = post.seoDescription ?? post.excerpt ?? undefined;
   const url = `https://propertyplanet.in/blog/${post.slug}`;
   return {
      title,
      description,
      alternates: { canonical: url },
      openGraph: {
         title: post.seoTitle ?? post.title,
         description,
         url,
         type: "article",
         images: post.ogImageUrl ? [post.ogImageUrl] : undefined,
      },
      // SEO fix (Section 20 — Twitter/X Card): see the identical note in
      // src/app/properties/page.tsx. Mirrors the openGraph block above —
      // same real article image, not the generic homepage favicon.
      twitter: {
         card: "summary_large_image",
         title: post.seoTitle ?? post.title,
         description,
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
         <ArticleJsonLd post={post} />
         <BreadcrumbJsonLd
            items={[
               { name: "Home", path: "/" },
               { name: "Insights", path: "/blog" },
               { name: post.title, path: `/blog/${post.slug}` },
            ]}
         />
         <HeaderTwo style_1={false} style_2={false} />
         <BlogDetail post={post} otherPosts={otherPosts} />
         <FooterOne style={true} />
      </Wrapper>
   );
};

export default BlogDetailPage;
