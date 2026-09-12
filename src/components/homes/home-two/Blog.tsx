import Link from "next/link"
import Image from "next/image"

import titleShape from "@/assets/images/shape/title_shape_01.svg"
import { getPublishedPosts } from "@/lib/blog/queries"

const formatDate = (iso: string | null) =>
   iso ? new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : null;

const Blog = async ({ style }: any) => {
   const posts = (await getPublishedPosts()).slice(0, 2);

   if (posts.length === 0) {
      // No published posts yet — skip the section rather than show broken
      // links to legacy demo blog pages.
      return null;
   }

   return (
      <div className="blog-section-one mt-150 xl-mt-120">
         <div className="container">
            <div className="position-relative">
               <div className="title-one mb-35 xl-mb-20 md-mb-10 wow fadeInUp">
                  {style ? <h3>Latest <span>News <Image src={titleShape} alt="" className="lazy-img" /></span></h3> :
                     <h2 className="font-garamond">Latest News</h2>}
                  <p className="fs-20 mt-xs">Get the latest update, tips &amp; tricks from our expert.</p>
               </div>

               <div className="row gx-xl-5">
                  {posts.map((item) => (
                     <div key={item.id} className="col-md-6">
                        <article className="blog-meta-one mt-35 wow fadeInUp">
                           <figure className={`post-img position-relative m0 ${style ? "rounded-5" : ""}`}>
                              {item.featuredImageUrl && (
                                 <Image src={item.featuredImageUrl} alt={item.title} fill style={{ objectFit: "cover" }} unoptimized />
                              )}
                              <Link href={`/blog/${item.slug}`} className={`stretched-link date tran3s ${style ? "rounded-5" : ""}`}>
                                 {formatDate(item.publishedAt)}
                              </Link>
                           </figure>
                           <div className="post-data">
                              <div className="post-info">
                                 <Link href={`/blog/${item.slug}`}>{item.category ?? "Property Planet"}</Link>
                                 {item.readingTimeMinutes ? ` · ${item.readingTimeMinutes} min` : ""}
                              </div>
                              <div className="d-flex justify-content-between align-items-sm-center flex-wrap">
                                 <Link href={`/blog/${item.slug}`} className="blog-title">
                                    <h4>{item.title}</h4>
                                 </Link>
                                 <Link href={`/blog/${item.slug}`} className={`read-btn d-flex align-items-center justify-content-center tran3s ${style ? "rounded-circle" : ""}`}>
                                    <i className="bi bi-arrow-up-right"></i></Link>
                              </div>
                           </div>
                        </article>
                     </div>
                  ))}
               </div>

               <div className="section-btn text-center md-mt-60">
                  <Link href="/blog" className="btn-eight"><span>Explore All</span> <i className="bi bi-arrow-up-right"></i></Link>
               </div>
            </div>
         </div>
      </div>
   )
}

export default Blog
