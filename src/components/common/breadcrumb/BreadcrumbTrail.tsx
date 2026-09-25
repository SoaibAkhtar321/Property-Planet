// src/components/common/breadcrumb/BreadcrumbTrail.tsx
//
// SEO fix (Stage 2 — Visible Breadcrumbs): BreadcrumbJsonLd has been
// emitting BreadcrumbList structured data on /properties/[slug],
// /projects/[slug] and /blog/[slug] for a while, but there was no
// matching *visible* breadcrumb trail anywhere in the UI — schema
// describing navigation a visitor could not actually see or click.
//
// The existing BreadcrumbOne/Two/Three components are full hero-banner
// components (own <h1>, background image, illustration, search bar) built
// for top-of-page use on the marketing inner-pages (/faq, /about,
// /terms-of-service). Dropping one of those onto a property/project/blog
// detail page would duplicate the page's real <h1> and require reworking
// the existing hero/gallery layout at the top of each page — exactly the
// kind of redesign the brief says not to do.
//
// This component is deliberately the opposite: a single-line, static
// trail with no heading, image, or layout opinion of its own. It takes
// the *same* `items` array already being passed to BreadcrumbJsonLd on
// each page, so the visible trail and the structured data can never drift
// apart — one array, two renders.
//
// Uses the theme's own `.theme-breadcrumb` list/link styling (see
// public/assets/scss/_banner.scss) so it matches the site's existing
// breadcrumb typography, but does not depend on the `.inner-banner`
// dark-hero color overrides that class normally lives inside of, since
// this renders on plain white/light page backgrounds instead.

import Link from "next/link";
import type { BreadcrumbItem } from "@/components/common/seo/BreadcrumbJsonLd";

const BreadcrumbTrail = ({ items }: { items: BreadcrumbItem[] }) => {
   if (items.length < 2) return null;

   return (
      <nav aria-label="Breadcrumb" className="container pt-30 md-pt-20">
         <ol
            className="theme-breadcrumb style-none d-flex flex-wrap align-items-center m0 p0"
            style={{ listStyle: "none" }}
         >
            {items.map((item, index) => {
               const isLast = index === items.length - 1;
               return (
                  <li
                     key={item.path}
                     className="d-flex align-items-center"
                     style={{ color: isLast ? "var(--pp-text-strong)" : "var(--pp-text-muted)" }}
                  >
                     {isLast ? (
                        <span aria-current="page">{item.name}</span>
                     ) : (
                        <Link href={item.path} style={{ color: "inherit" }}>
                           {item.name}
                        </Link>
                     )}
                     {!isLast && <span className="mx-2">/</span>}
                  </li>
               );
            })}
         </ol>
      </nav>
   );
};

export default BreadcrumbTrail;
