import { Property } from "../data/types";

// The schema (property_media, media_type='video') stores an uploaded file's
// storage path, not a YouTube video ID, so this renders a plain HTML5
// <video> element instead of the template's YouTube ModalVideo popup.

const VideoTour = ({ property }: { property: Property }) => {
   if (!property.videoUrl) return null;

   return (
      <div className="accordion-item">
         <h2 className="accordion-header">
            <button
               className="accordion-button collapsed"
               type="button"
               data-bs-toggle="collapse"
               data-bs-target="#collapseVideoTour"
               aria-expanded="false"
               aria-controls="collapseVideoTour"
            >
               Video Tour
            </button>
         </h2>
         <div id="collapseVideoTour" className="accordion-collapse collapse">
            <div className="accordion-body">
               <div className="property-video-tour">
                  <video controls preload="metadata" className="w-100" poster={property.images[0]}>
                     <source src={property.videoUrl} />
                  </video>
               </div>
            </div>
         </div>
      </div>
   );
};

export default VideoTour;
