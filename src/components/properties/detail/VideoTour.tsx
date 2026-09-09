"use client";

import { useState } from "react";
import Image from "next/image";
import VideoPopup from "@/modals/VideoPopup";
import { Property } from "../data/types";

const VideoTour = ({ property }: { property: Property }) => {
   const [isVideoOpen, setIsVideoOpen] = useState(false);

   if (!property.videoId) return null;

   return (
      <>
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
                     <div className="position-relative image-bg overflow-hidden z-1">
                        <Image src={property.images[0]} alt="" width={800} height={500} className="lazy-img w-100" />
                        <a
                           onClick={() => setIsVideoOpen(true)}
                           style={{ cursor: "pointer" }}
                           className="video-icon tran3s rounded-circle d-flex align-items-center justify-content-center"
                        >
                           <i className="fa-thin fa-play"></i>
                        </a>
                     </div>
                  </div>
               </div>
            </div>
         </div>
         <VideoPopup isVideoOpen={isVideoOpen} setIsVideoOpen={setIsVideoOpen} videoId={property.videoId} />
      </>
   );
};

export default VideoTour;
