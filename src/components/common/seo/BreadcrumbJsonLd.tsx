// BreadcrumbList structured data. Pass the same crumbs already shown by
// the visible breadcrumb component (BreadcrumbOne/Two/Three etc.) for a
// given page — every URL here must be a real, reachable page.

const SITE_URL = "https://propertyplanet.in";

export type BreadcrumbItem = { name: string; path: string };

export default function BreadcrumbJsonLd({ items }: { items: BreadcrumbItem[] }) {
   const data = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: items.map((item, index) => ({
         "@type": "ListItem",
         position: index + 1,
         name: item.name,
         item: `${SITE_URL}${item.path}`,
      })),
   };

   return (
      <script
         type="application/ld+json"
         // eslint-disable-next-line react/no-danger
         dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
      />
   );
}
