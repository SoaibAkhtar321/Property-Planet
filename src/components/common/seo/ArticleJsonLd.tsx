// BlogPosting structured data for a published blog article. Only fields
// the post record actually has are included -- no invented author (the
// data model has no author field, so `author` is omitted rather than
// guessed), no fabricated ratings/reviews.

const SITE_URL = "https://propertyplanet.in";

export type ArticleJsonLdPost = {
   title: string;
   slug: string;
   excerpt: string | null;
   featuredImageUrl: string | null;
   publishedAt: string | null;
};

export default function ArticleJsonLd({ post }: { post: ArticleJsonLdPost }) {
   const data: Record<string, unknown> = {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: post.title,
      url: `${SITE_URL}/blog/${post.slug}`,
      publisher: {
         "@type": "Organization",
         name: "Property Planet",
         url: SITE_URL,
      },
   };

   if (post.excerpt) data.description = post.excerpt;
   if (post.featuredImageUrl) data.image = post.featuredImageUrl;
   if (post.publishedAt) data.datePublished = post.publishedAt;

   return (
      <script
         type="application/ld+json"
         // eslint-disable-next-line react/no-danger
         dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
      />
   );
}
