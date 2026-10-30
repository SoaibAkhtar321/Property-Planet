"use client";

// App-style bottom navigation for phones (hidden from 992px up, where the
// header menu is visible). Public pages only: the buyer/seller dashboards
// and the admin panel have their own sidebar navigation.

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSupabaseUser } from "@/hooks/useSupabaseUser";

// Icons that ship a "-fill" variant in Bootstrap Icons 1.11.
const FILLED = new Set(["bi-house-door", "bi-buildings", "bi-chat-dots", "bi-heart"]);
const HIDDEN_PREFIXES = ["/dashboard", "/admin", "/auth"];

type Item = { key: string; label: string; icon: string; href?: string; match?: (p: string) => boolean; modal?: boolean };

export default function MobileBottomNav() {
   const pathname = usePathname() ?? "/";
   const { user, role, loading } = useSupabaseUser();
   if (HIDDEN_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return null;

   const accountHref = role === "admin" ? "/admin" : "/dashboard/dashboard-index";
   const items: Item[] = [
      { key: "home", label: "Home", icon: "bi-house-door", href: "/", match: (p) => p === "/" },
      { key: "search", label: "Search", icon: "bi-search", href: "/properties", match: (p) => p.startsWith("/properties") || p.startsWith("/places") },
      { key: "projects", label: "Projects", icon: "bi-buildings", href: "/projects", match: (p) => p.startsWith("/projects") },
      user
         ? { key: "saved", label: "Saved", icon: "bi-heart", href: "/dashboard/favourites" }
         : { key: "contact", label: "Contact", icon: "bi-chat-dots", href: "/contact", match: (p) => p.startsWith("/contact") },
      user || loading
         ? { key: "account", label: "Account", icon: "bi-person-circle", href: accountHref }
         : { key: "login", label: "Login", icon: "bi-person-circle", modal: true },
   ];

   return (
      <nav className="pp-bottom-nav d-lg-none" aria-label="Main">
         {items.map((item) => {
            const active = item.match?.(pathname) ?? false;
            const body = (
               <>
                  <i className={`bi ${active && FILLED.has(item.icon) ? `${item.icon}-fill` : item.icon}`} aria-hidden="true"></i>
                  <span>{item.label}</span>
               </>
            );
            return item.modal ? (
               <button key={item.key} type="button" className="pp-bottom-nav__item" data-bs-toggle="modal" data-bs-target="#loginModal">
                  {body}
               </button>
            ) : (
               <Link key={item.key} href={item.href!} className={`pp-bottom-nav__item ${active ? "is-active" : ""}`} aria-current={active ? "page" : undefined}>
                  {body}
               </Link>
            );
         })}
      </nav>
   );
}
