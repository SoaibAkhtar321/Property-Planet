import Wrapper from "@/layouts/Wrapper";
import HeaderTwo from "@/layouts/headers/HeaderTwo";
import FooterOne from "@/layouts/footers/FooterOne";
import PropertiesListing from "@/components/properties/PropertiesListing";
import type { PropertyFilterState } from "@/components/properties/PropertyFilters";
import {
   searchPublishedProperties,
   getPropertyFacets,
   PROPERTY_SORTS,
   type PropertySort,
} from "@/lib/properties/queries";

// Always fetch fresh — published inventory changes independently of any
// build, and this route reads through Supabase (RLS-scoped to published
// rows only), not local demo data.
export const dynamic = "force-dynamic";

// Phase 25: a single canonical URL for the listing regardless of which
// filter/sort/page combination produced it, so filtered permutations are
// not indexed as separate thin pages competing with each other.
const CANONICAL = "https://propertyplanet.in/properties";
const DESCRIPTION =
   "Browse curated individual plots, villas, houses and apartments for sale across Hyderabad and the Future City corridor with Property Planet.";

export const metadata = {
   title: "Explore Properties | Property Planet",
   description: DESCRIPTION,
   alternates: { canonical: CANONICAL },
   openGraph: {
      title: "Explore Properties | Property Planet",
      description: DESCRIPTION,
      url: CANONICAL,
      type: "website",
      siteName: "Property Planet",
   },
   // SEO fix (Section 20 — Twitter/X Card): without its own `twitter`
   // block, this page silently inherited the root layout's generic
   // homepage title/description/image on Twitter/X, even though the
   // openGraph block above (used by every other platform) already has
   // page-specific copy.
   twitter: {
      card: "summary_large_image",
      title: "Explore Properties | Property Planet",
      description: DESCRIPTION,
   },
};

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value) ?? "";

const numberOrUndefined = (value: string) => {
   if (!value.trim()) return undefined;
   const n = Number(value);
   return Number.isFinite(n) && n >= 0 ? n : undefined;
};

const PropertiesPage = async ({
   searchParams,
}: {
   searchParams: {
      q?: string;
      propertyType?: string;
      city?: string;
      locality?: string;
      /** Legacy alias for `locality`, kept so existing links and bookmarks
       * from the homepage locality cards keep working. */
      location?: string;
      minPrice?: string;
      maxPrice?: string;
      minArea?: string;
      maxArea?: string;
      sort?: string;
      page?: string;
   };
}) => {
   // Phase 8: the locality cards link to ?locality=<value>; ?location= was
   // the previous parameter name and is still accepted here so older links
   // resolve to the same filtered listing rather than silently showing
   // everything.
   const locality = first(searchParams.locality) || first(searchParams.location);

   const filters: PropertyFilterState = {
      q: first(searchParams.q),
      propertyType: first(searchParams.propertyType),
      city: first(searchParams.city),
      locality,
      minPrice: first(searchParams.minPrice),
      maxPrice: first(searchParams.maxPrice),
      minArea: first(searchParams.minArea),
      maxArea: first(searchParams.maxArea),
      sort: PROPERTY_SORTS.includes(first(searchParams.sort) as PropertySort) ? first(searchParams.sort) : "newest",
   };

   const requestedPage = Number(first(searchParams.page));
   const page = Number.isFinite(requestedPage) && requestedPage > 0 ? Math.floor(requestedPage) : 1;

   const [result, facets] = await Promise.all([
      searchPublishedProperties({
         q: filters.q,
         propertyType: filters.propertyType,
         city: filters.city,
         locality: filters.locality,
         minPrice: numberOrUndefined(filters.minPrice),
         maxPrice: numberOrUndefined(filters.maxPrice),
         minArea: numberOrUndefined(filters.minArea),
         maxArea: numberOrUndefined(filters.maxArea),
         sort: filters.sort as PropertySort,
         page,
      }),
      getPropertyFacets(),
   ]);

   return (
      <Wrapper>
         <HeaderTwo style_1={false} style_2={false} />
         <PropertiesListing
            items={result.items}
            total={result.total}
            page={result.page}
            totalPages={result.totalPages}
            filters={filters}
            facets={facets}
         />
         <FooterOne style={true} />
      </Wrapper>
   );
};

export default PropertiesPage;
