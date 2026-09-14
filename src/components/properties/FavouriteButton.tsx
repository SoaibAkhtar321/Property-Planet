"use client";

import { useState, useTransition } from "react";
import { addFavourite, removeFavourite } from "@/lib/favourites/actions";

interface FavouriteButtonProps {
   propertyId: string;
   initiallyFavourited?: boolean;
   className?: string;
}

/**
 * Heart toggle for saving/removing a property from the buyer's Favourites.
 * Reuses the template's existing `.fav-btn` styling — that class already
 * existed in the markup, it just wasn't wired to anything real.
 *
 * Unauthenticated visitors: the server action redirects (via
 * requireDashboardUser) rather than erroring, so this optimistically
 * updates, and a signed-out click will simply bounce to "/" like any
 * other dashboard-only action in this app.
 */
const FavouriteButton = ({ propertyId, initiallyFavourited = false, className }: FavouriteButtonProps) => {
   const [isFavourited, setIsFavourited] = useState(initiallyFavourited);
   const [isPending, startTransition] = useTransition();

   const handleClick = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const next = !isFavourited;
      setIsFavourited(next);

      startTransition(async () => {
         const result = next ? await addFavourite(propertyId) : await removeFavourite(propertyId);
         if (!result.success) {
            // Revert optimistic update on failure.
            setIsFavourited(!next);
         }
      });
   };

   return (
      <button
         type="button"
         onClick={handleClick}
         disabled={isPending}
         className={`fav-btn tran3s border-0 ${className ?? ""}`}
         aria-pressed={isFavourited}
         aria-label={isFavourited ? "Remove from favourites" : "Save to favourites"}
      >
         <i className={isFavourited ? "fa-solid fa-heart" : "fa-light fa-heart"}></i>
      </button>
   );
};

export default FavouriteButton;
