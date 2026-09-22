import Fancybox from "@/components/common/Fancybox";

const MediaGallery = ({ images, title }: { images: string[]; title: string }) => {
   // Phase 4B: previously this returned null for a listing with no photos
   // yet, so the page jumped straight from the header into the accordion
   // with no gallery band at all. PropertyCard already has a "Photos
   // coming soon" empty state (see pp-card__img--empty) for the same
   // situation on /properties — this mirrors that instead of leaving a
   // silent gap.
   if (!images || images.length === 0) {
      return (
         <div className="media-gallery-grid mb-50">
            <div className="row">
               <div className="col-12 d-flex">
                  <div className="media-bg h-100 w-100 d-flex align-items-center justify-content-center text-center fs-16 color-dark" style={{ minHeight: 260, background: "#f5f0eb" }}>
                     Photos coming soon
                  </div>
               </div>
            </div>
         </div>
      );
   }

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
