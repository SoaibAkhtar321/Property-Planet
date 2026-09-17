import Image from "next/image";
import Link from "next/link";
import { BlogPost } from "@/lib/blog/queries";
import SimilarPosts from "./SimilarPosts";

const formatDate = (iso: string | null) =>
   iso ? new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : null;

// Article body is currently rendered as plain paragraphs, split on blank
// lines — no rich-text/HTML rendering has been introduced in this phase
// (see 0010_blog_posts.sql's comment on blog_posts.content).
const renderContent = (content: string) => {
   const paragraphs = content.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
   if (paragraphs.length === 0) return null;
   return paragraphs.map((paragraph, i) => <p key={i}>{paragraph}</p>);
};

const BlogDetail = ({ post, otherPosts }: { post: BlogPost; otherPosts: BlogPost[] }) => {
   const date = formatDate(post.publishedAt);

   return (
      <div className="blog-details border-top mt-130 xl-mt-100 pt-100 xl-pt-80 mb-150 xl-mb-100">
         <div className="container">
            <div className="row gx-xl-5">
               <div className="col-lg-8">
                  <div className="blog-post-meta mb-60 lg-mb-40">
                     <div className="post-info">
                        {post.category ?? "Property Planet"}
                        {post.readingTimeMinutes ? ` · ${post.readingTimeMinutes} min` : ""}
                     </div>
                     <h3 className="blog-title">{post.title}</h3>
                  </div>
               </div>
            </div>
            <div className="row gx-xl-5">
               <div className="col-lg-8">
                  <article className="blog-post-meta">
                     {post.featuredImageUrl ? (
                        <figure className="post-img position-relative m0" style={{ aspectRatio: "16 / 9" }}>
                           <Image src={post.featuredImageUrl} alt={post.title} fill style={{ objectFit: "cover" }} unoptimized />
                           {date && <div className="fw-500 date d-inline-block">{date}</div>}
                        </figure>
                     ) : (
                        date && <div className="fw-500 mb-30">{date}</div>
                     )}
                     <div className="post-data pt-50 md-pt-30">{renderContent(post.content)}</div>
                     {/* SEO fix (Stage 2 — Internal Linking): every blog
                         article previously dead-ended here (or at
                         SimilarPosts) with no path back to the site's actual
                         conversion pages. This is deliberately generic
                         navigation rather than a specific property/project
                         claim — the article's content is free text with no
                         structured link to any one listing, so linking to a
                         particular property/project here would be an
                         invented, likely-false relevance claim rather than a
                         real one. Browse-all links to /properties and
                         /projects, plus a way back to /blog, are the safe,
                         genuinely-useful version of that same goal. */}
                     <div className="d-flex flex-wrap gap-3 mt-50 pt-30 border-top">
                        <Link href="/properties" className="pp-card-btn pp-card-btn--primary px-4">
                           Browse Properties <i className="bi bi-arrow-up-right ms-2" aria-hidden="true"></i>
                        </Link>
                        <Link href="/projects" className="pp-card-btn px-4">
                           Browse Projects <i className="bi bi-arrow-up-right ms-2" aria-hidden="true"></i>
                        </Link>
                        <Link href="/blog" className="fs-16 fw-500 d-flex align-items-center ms-auto">
                           <i className="bi bi-arrow-left me-1" aria-hidden="true"></i>
                           Back to Insights
                        </Link>
                     </div>
                  </article>
               </div>
            </div>
         </div>
         {otherPosts.length > 0 && <SimilarPosts items={otherPosts} />}
      </div>
   );
};

export default BlogDetail;
