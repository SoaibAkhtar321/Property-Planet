"use client"
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

// Small RERA certificate thumbnail that opens the full certificate in a
// lightbox. Works for image and PDF certificates; Esc / backdrop / close
// button dismiss it, and page scroll is locked while it's open. Rendered
// into <body> through a portal so the sticky header can't sit on top of it.
export default function ReraCertificateViewer({
   url,
   title,
   fileType,
}: {
   url: string;
   title: string;
   fileType: "image" | "pdf";
}) {
   const [open, setOpen] = useState(false);

   useEffect(() => {
      if (!open) return;
      const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
      document.addEventListener("keydown", onKey);
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
         document.removeEventListener("keydown", onKey);
         document.body.style.overflow = prev;
      };
   }, [open]);

   return (
      <>
         <button type="button" className="pp-rera-thumb" onClick={() => setOpen(true)} aria-label={`View ${title}`}>
            {fileType === "image" ? (
               // eslint-disable-next-line @next/next/no-img-element
               <img src={url} alt="" loading="lazy" />
            ) : (
               <span className="pp-rera-thumb__pdf"><i className="bi bi-file-earmark-pdf" aria-hidden="true"></i>PDF</span>
            )}
            <span className="pp-rera-thumb__zoom"><i className="bi bi-arrows-fullscreen" aria-hidden="true"></i></span>
         </button>

         {open && createPortal(
            <div className="pp-rera-lightbox" role="dialog" aria-modal="true" aria-label={title} onClick={() => setOpen(false)}>
               <div className="pp-rera-lightbox__inner" onClick={(e) => e.stopPropagation()}>
                  <div className="pp-rera-lightbox__bar">
                     <span>{title}</span>
                     <div className="d-flex align-items-center gap-3">
                        <a href={url} target="_blank" rel="noopener noreferrer">Open <i className="bi bi-box-arrow-up-right"></i></a>
                        <button type="button" onClick={() => setOpen(false)} aria-label="Close"><i className="bi bi-x-lg"></i></button>
                     </div>
                  </div>
                  {fileType === "image" ? (
                     // eslint-disable-next-line @next/next/no-img-element
                     <img src={url} alt={title} className="pp-rera-lightbox__img" />
                  ) : (
                     <iframe src={url} title={title} className="pp-rera-lightbox__pdf" />
                  )}
               </div>
            </div>,
            document.body
         )}
      </>
   );
}
