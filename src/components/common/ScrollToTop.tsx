"use client"
import UseSticky from "@/hooks/UseSticky";
import { useState, useEffect } from "react";

const ScrollToTop = () => {
   const { sticky }: { sticky: boolean } = UseSticky();

   const [showScroll, setShowScroll] = useState(false);

   const scrollTop = () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
   };

   // Step 3G: the active effect below defines and uses its own local
   // checkScrollTop (closing over `showScroll`), but its dependency array
   // referenced a same-named OUTER function that was never called from
   // here -- a leftover from an earlier inline-vs-outer refactor (see the
   // dead commented-out effect this replaces). That stale outer function
   // and the incorrect `[checkScrollTop]` dependency were the source of
   // the react-hooks/exhaustive-deps warning. Fix: drop the unused outer
   // function and the dead commented effect, and depend on what the
   // effect actually closes over (`showScroll`) -- no behavior change,
   // same listener re-subscribe-on-threshold-change pattern as before.
   useEffect(() => {
      const checkScrollTop = () => {
         if (!showScroll && window.pageYOffset > 400) {
            setShowScroll(true);
         } else if (showScroll && window.pageYOffset <= 400) {
            setShowScroll(false);
         }
      };

      window.addEventListener("scroll", checkScrollTop);
      return () => window.removeEventListener("scroll", checkScrollTop);
   }, [showScroll]);

   return (
      <>
         <div onClick={scrollTop} className={`scroll-top ${sticky ? "active" : ""}`}>
            <i className="bi bi-arrow-up-short"></i>
         </div>
      </>
   )
}

export default ScrollToTop
