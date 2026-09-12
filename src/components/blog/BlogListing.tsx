import { BlogPost } from "@/lib/blog/queries";
import BlogCard from "./BlogCard";

// Reuses the existing template's blog-section-three / blog-meta-two CSS
// classes (see public/assets/scss/_blog.scss and
// src/components/blogs/blog-one/BlogOneArea.tsx) for visual consistency
// with the rest of the site — no new design system introduced, per the
// Phase 6 scope boundary (full visual pass is Phase 7).

const BlogListing = ({ items }: { items: BlogPost[] }) => {
   return (
      <div className="blog-section-three mt-130 xl-mt-100 mb-150 xl-mb-100">
         <div className="container container-large">
            <div className="row">
               <div className="col-12">
                  <div className="title-one mb-50 lg-mb-30">
                     <h2 className="font-garamond">Property Planet Insights</h2>
                     <p className="fs-22 mt-xs">
                        Guidance on buying and selling plots, land and property in and around Hyderabad&apos;s growth corridors.
                     </p>
                  </div>
               </div>
            </div>

            {items.length > 0 ? (
               <div className="row gx-xxl-5">
                  {items.map((item) => (
                     <div key={item.id} className="col-md-6 col-lg-4">
                        <BlogCard item={item} />
                     </div>
                  ))}
               </div>
            ) : (
               <p className="fs-20">
                  No articles are published yet. Check back soon — new Property Planet guides will appear here as
                  they&apos;re added.
               </p>
            )}
         </div>
      </div>
   );
};

export default BlogListing;
