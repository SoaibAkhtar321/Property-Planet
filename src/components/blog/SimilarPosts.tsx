import { BlogPost } from "@/lib/blog/queries";
import BlogCard from "./BlogCard";

const SimilarPosts = ({ items }: { items: BlogPost[] }) => {
   if (!items || items.length === 0) return null;

   return (
      <div className="container mt-100 xl-mt-80">
         <h4 className="mb-40">More from Property Planet</h4>
         <div className="row gx-xxl-5">
            {items.map((item) => (
               <div key={item.id} className="col-md-6 col-lg-4">
                  <BlogCard item={item} />
               </div>
            ))}
         </div>
      </div>
   );
};

export default SimilarPosts;
