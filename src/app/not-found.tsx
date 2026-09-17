import Error from "@/components/inner-pages/error";
import Wrapper from "@/layouts/Wrapper";

// SEO fix (Section 23 — 404 and Redirects): this file did not exist
// before. Next's App Router only serves a real HTTP 404 for (a) a URL
// that matches no route at all, or (b) a route that explicitly calls
// notFound() -- in both cases via THIS special file. Neither case was
// wired up correctly before:
//
//  - Case (a) was actually intercepted by src/app/[...not-found]/, a
//    literal catch-all *route* (not the not-found convention) that
//    matches any otherwise-unmatched path and renders as an ordinary
//    page -- which Next serves with HTTP 200, not 404. That meant any
//    mistyped/invalid URL on the whole site (e.g. /asdkjasd) returned
//    200 with a "page not found"-looking page: a soft 404, exactly the
//    kind of thing Search Console flags and that wastes crawl budget on
//    URLs that should be dropped, not indexed.
//  - Case (b) -- notFound() calls already used correctly in
//    properties/[slug], projects/[slug], blog/[slug], and
//    places/[locality] -- had no root not-found.tsx to render, so those
//    silently fell back to Next's bare, unstyled default 404 instead of
//    the site's own Error component.
//
// This file fixes both at once, and the redundant catch-all route
// (which would otherwise keep shadowing this one for case (a)) is
// removed in the same change.
export const metadata = {
   title: "Page Not Found | Property Planet",
   robots: { index: false, follow: true },
};

export default function NotFound() {
   return (
      <Wrapper>
         <Error />
      </Wrapper>
   );
}
