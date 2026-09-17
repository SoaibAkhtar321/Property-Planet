import Fancybox from "@/components/common/Fancybox";

const MediaGallery = ({ images, title }: { images: string[]; title: string }) => {
   if (!images || images.length === 0) return null;

   const [main, ...rest] = images;

   return (
      <div className="media-gallery-grid mb-50">
         <div className="row">
            <div className="col-md-7 d-flex">
               <div className="position-relative h-100 w-100 sm-pb-20">
                  <a
                     className="media-bg h-100"
                     style={{ backgroundImage: `url(${main})` }}
                     role="img"
                     aria-label={`${title} — main photo`}
                  ></a>
                  {rest.length > 0 && (
                     <Fancybox options={{ Carousel: { infinite: true } }}>
                        <div className="img-fancy-btn fw-500 fs-16 color-dark">
                           See all {images.length} photos
                           {images.map((img, index) => (
                              <a key={index} className="d-block" data-fancybox="property-gallery" href={img} aria-label={`${title} photo ${index + 1}`}></a>
                           ))}
                        </div>
                     </Fancybox>
                  )}
               </div>
            </div>
            {rest.length > 0 && (
               <div className="col-md-5 d-flex">
                  <div className="w-100 h-100">
                     <div className="row">
                        {rest.slice(0, 4).map((img, index) => (
                           <div key={index} className="col-6 mb-25 md-mb-20">
                              <a
                                 href={img}
                                 className="media-bg sm"
                                 style={{ backgroundImage: `url(${img})` }}
                                 role="img"
                                 aria-label={`${title} photo ${index + 2}`}
                              ></a>
                           </div>
                        ))}
                     </div>
                  </div>
               </div>
            )}
         </div>
      </div>
   );
};

export default MediaGallery;
