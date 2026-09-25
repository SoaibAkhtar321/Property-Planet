/**
 * Seller-facing "free to list" notice. Purely informational -- does not
 * touch pricing/business logic, just states the existing model in plain
 * language: listing is free, charges (if any) only apply later on a
 * successful sale, per business terms. Never shown to buyers.
 *
 * variant="card"  -- boxed callout, for form/registration contexts
 * variant="inline" -- compact badge + line, for CTA sections
 */
interface FreeListingNoticeProps {
   variant?: "card" | "inline";
   className?: string;
}

const FreeListingNotice = ({ variant = "card", className = "" }: FreeListingNoticeProps) => {
   if (variant === "inline") {
      return (
         <p className={`fs-16 mt-15 mb-0 ${className}`}>
            <span className="badge bg-success me-2">Free</span>
            No upfront listing charges — list your property at no cost. Charges may apply only if
            your property is successfully sold, as per our business terms.
         </p>
      );
   }

   return (
      <div
         className={`mb-30 ${className}`}
         style={{ border: "1px solid #cdeccd", borderRadius: 16, padding: "18px 22px", background: "#f3fbf3" }}
      >
         <h6 className="mb-5">
            <span className="badge bg-success me-2">Free</span>
            List Your Property for Free
         </h6>
         <p className="fs-15 mb-0 opacity-75">
            There are no upfront listing charges — creating a listing on Property Planet costs you
            nothing. Charges may apply later only if your property is successfully sold, according
            to our business terms.
         </p>
      </div>
   );
};

export default FreeListingNotice;
