interface DataType {
   id: number;
   page: string;
   widget_title: string;
   widget_class?: string;
   widget_class2?: string;
   footer_link: {
      link: string;
      link_title: string;
   }[];

}

const footer_data: DataType[] = [
   {
      id: 1,
      page: "home_1",
      widget_class: "xs-mt-50",
      widget_title: "Links",
      // SEO fix (Stage 2 — Internal Linking / Broken Links): this is the
      // footer actually rendered site-wide (FooterOne, via page === "home_1")
      // on every real properties/projects/blog/places page. It previously
      // linked to template leftovers that 404 on this site
      // (/about_us_01, /blog_01, /blog_02, /pricing_02 — the real routes are
      // /about and /blog; there is no careers or pricing page) and to
      // /dashboard/dashboard-index, a signed-in-only route that doesn't
      // belong in a public, sitewide footer. Fixed to real routes only;
      // nothing invented for the pages that don't exist.
      footer_link: [{ link: "/", link_title: "Home" }, { link: "/about", link_title: "About Company" }, { link: "/blog", link_title: "Blog" },]
   },
   {
      id: 2,
      widget_class: "xs-mt-30",
      page: "home_1",
      widget_title: "Legal",
      footer_link: [{ link: "/terms-of-service", link_title: "Terms & conditions" }, { link: "/privacy-policy", link_title: "Privacy policy" }, { link: "/faq", link_title: "Faq’s" },]
   },
   {
      id: 3,
      widget_class: "xs-mt-30",
      page: "home_1",
      widget_title: "New Listing",
      footer_link: [{ link: "/properties", link_title: "​Buy Apartments" }, { link: "/properties", link_title: "Buy Condos" }, { link: "/properties", link_title: "Rent Houses" }, { link: "/properties", link_title: "Rent Industrial" }, { link: "/properties", link_title: "Buy Villas" }, { link: "/properties", link_title: "Rent Office" },]
   },

   // home two

   {
      id: 1,
      page: "home_3",
      widget_title: "Links",
      // SEO fix (Stage 2): same broken-link fix as the home_1 block above —
      // this is FooterTwo's data, live on /about.
      footer_link: [{ link: "/", link_title: "Home" }, { link: "/about", link_title: "About Company" }, { link: "/blog", link_title: "Blog" },]
   },
   {
      id: 2,
      widget_class: "col-xxl-3 col-xl-4",
      page: "home_3",
      widget_title: "Legal",
      footer_link: [{ link: "/terms-of-service", link_title: "Terms & conditions" }, { link: "/privacy-policy", link_title: "Privacy policy" }, { link: "/faq", link_title: "Faq’s" },]
   },
   {
      id: 3,
      page: "home_3",
      widget_title: "New Listing",
      // SEO fix (Stage 4): same /listing_01.."06 → /properties fix already
      // applied to the home_1 and home_5 blocks — missed this one (home_3,
      // live on /about via FooterTwo) in the earlier pass.
      footer_link: [{ link: "/properties", link_title: "​Buy Apartments" }, { link: "/properties", link_title: "Buy Condos" }, { link: "/properties", link_title: "Rent Houses" }, { link: "/properties", link_title: "Rent Industrial" }, { link: "/properties", link_title: "Buy Villas" }, { link: "/properties", link_title: "Rent Office" },]
   },

   // home four intentionally removed (Stage 4 dead-code cleanup): no Footer
   // component (FooterOne -> "home_1", FooterTwo -> "home_3", FooterFour ->
   // "home_5") ever filters on "home_4" — this data was unreachable from any
   // route and, like the other blocks, pointed at nonexistent template pages.

   // home five

   {
      id: 1,
      page: "home_5",
      widget_class: "col-lg-3 ms-auto",
      widget_class2: "ps-xl-5",
      widget_title: "Links",
      // SEO fix (Stage 2): same broken-link fix as the home_1 block above —
      // this is FooterFour's data, live on /faq, /contact, /privacy-policy
      // and /terms-of-service.
      footer_link: [{ link: "/", link_title: "Home" }, { link: "/about", link_title: "About Company" }, { link: "/blog", link_title: "Blog" },]
   },
   {
      id: 2,
      widget_class: "col-lg-3",
      page: "home_5",
      widget_title: "Legal",
      footer_link: [{ link: "/terms-of-service", link_title: "Terms & conditions" }, { link: "/privacy-policy", link_title: "Privacy policy" }, { link: "/faq", link_title: "Faq’s" },]
   },
   {
      id: 3,
      widget_class: "col-lg-2",
      page: "home_5",
      widget_title: "New Listing",
      // SEO fix (Stage 2): /listing_01.."06 are template routes that don't
      // exist on this site (404s in a live footer). Property Planet doesn't
      // have per-category listing pages/filters confirmed yet (see the
      // Stage 3 location-SEO note on not inventing filter URLs), so — same
      // as the equivalent home_1 "New Listing" block — these all point at
      // the real /properties listing page rather than a guessed filter URL.
      footer_link: [{ link: "/properties", link_title: "​Buy Apartments" }, { link: "/properties", link_title: "Buy Condos" }, { link: "/properties", link_title: "Rent Houses" }, { link: "/properties", link_title: "Rent Industrial" }, { link: "/properties", link_title: "Buy Villas" }, { link: "/properties", link_title: "Rent Office" },]
   },
]

export default footer_data;