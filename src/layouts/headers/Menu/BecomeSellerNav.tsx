"use client"
// src/layouts/headers/Menu/BecomeSellerNav.tsx
//
// Replaces the old hardcoded "Add Listing" link (which pointed straight at
// /dashboard/add-property for literally everyone -- logged out, buyer, or
// seller -- and just silently bounced non-sellers off that page's auth
// gate). This is session-aware and sends each visitor to the place that's
// actually useful to them:
//   - logged out               -> /seller/login (which also links to
//                                  /seller/register for first-timers)
//   - logged in, role buyer    -> /seller/register (an existing buyer
//                                  account doesn't carry seller access;
//                                  becoming a seller is a separate,
//                                  email-verified account)
//   - logged in, role seller   -> /dashboard/add-property directly
//   - logged in, role admin    -> hidden; admins manage listings from /admin

import Link from "next/link"
import { useSupabaseUser } from "@/hooks/useSupabaseUser"

interface BecomeSellerNavProps {
   className?: string;
   iconClassName?: string;
}

const BecomeSellerNav = ({ className, iconClassName = "fa-thin fa-arrow-up-right" }: BecomeSellerNavProps) => {
   const { user, role, loading } = useSupabaseUser();

   if (loading || role === "admin") {
      return null;
   }

   let href = "/seller/login";
   let label = "Become a Seller";

   if (user && role === "seller") {
      href = "/dashboard/add-property";
      label = "Add Listing";
   } else if (user && role === "buyer") {
      href = "/seller/register";
   }

   return (
      <Link href={href} className={className}>
         <span>{label}</span> <i className={iconClassName}></i>
      </Link>
   );
};

export default BecomeSellerNav
