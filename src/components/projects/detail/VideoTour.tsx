import { Project } from "../data/types";

// project_media stores an uploaded file's storage path, not a YouTube video
// ID, so this renders a plain HTML5 <video> element (same approach as
// properties/detail/VideoTour.tsx).

const VideoTour = ({ project }: { project: Project }) => {
   const videoUrl = project.media?.video;
   if (!videoUrl) return null;

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
               Video
            </button>
         </h2>
         <div id="collapseVideoTour" className="accordion-collapse collapse">
            <div className="accordion-body">
               <video controls preload="metadata" className="w-100" poster={project.images[0]}>
                  <source src={videoUrl} />
               </video>
            </div>
         </div>
      </div>
   );
};

export default VideoTour;
