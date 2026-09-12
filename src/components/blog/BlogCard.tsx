import Image from "next/image";
import Link from "next/link";
import { BlogPost } from "@/lib/blog/queries";

const formatDate = (iso: string | null) =>
   iso ? new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : null;

const BlogCard = ({ item }: { item: BlogPost }) => {
   return (
      <article className="blog-meta-two tran3s position-relative z-1 mb-70 lg-mb-40 h-100">
         <figure className="post-img position-relative m0">
            <Link href={`/blog/${item.slug}`} className="d-block position-relative" style={{ aspectRatio: "3 / 2" }}>
               {item.featuredImageUrl ? (
                  <Image src={item.featuredImageUrl} alt={item.title} fill style={{ objectFit: "cover" }} unoptimized />
               ) : (
                  <div className="w-100 h-100 d-flex align-items-center justify-content-center bg-light text-muted">
                     Image coming soon
                  </div>
               )}
            </Link>
            {formatDate(item.publishedAt) && (
               <Link href={`/blog/${item.slug}`} className="date">
                  {formatDate(item.publishedAt)}
               </Link>
            )}
         </figure>
         <div className="post-data">
            <div className="post-info">
               {item.category ?? "Property Planet"}
               {item.readingTimeMinutes ? ` · ${item.readingTimeMinutes} min` : ""}
            </div>
            <Link href={`/blog/${item.slug}`} className="blog-title">
               <h4>{item.title}</h4>
            </Link>
            {item.excerpt && <p className="fs-16 mt-2">{item.excerpt}</p>}
         </div>
      </article>
   );
};

export default BlogCard;
