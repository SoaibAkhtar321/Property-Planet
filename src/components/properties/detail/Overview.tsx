import { Property } from "../data/types";

const Overview = ({ property }: { property: Property }) => {
   const items = property.overviewItems;
   if (!items || items.length === 0) return null;

   return (
      <div className="property-feature-list position-relative z-2 mt-65 mb-75">
         <div className="dark-bg ps-3 ps-md-5 pe-3 pt-30 pb-30">
            <ul className="style-none d-flex flex-wrap align-items-center justify-content-between">
               {items.map((item, index) => (
                  <li key={index}>
                     <span className="fs-20 text-white">
                        {item.label} . {item.value}
                     </span>
                  </li>
               ))}
            </ul>
         </div>
      </div>
   );
};

export default Overview;
