import { notFound } from "next/navigation";
import Wrapper from "@/layouts/Wrapper";
import HeaderTwo from "@/layouts/headers/HeaderTwo";
import FooterOne from "@/layouts/footers/FooterOne";
import ProjectDetail from "@/components/projects/ProjectDetail";
import BreadcrumbJsonLd from "@/components/common/seo/BreadcrumbJsonLd";
import BreadcrumbTrail from "@/components/common/breadcrumb/BreadcrumbTrail";
import ProjectJsonLd from "@/components/common/seo/ProjectJsonLd";
import { getProjectBySlug, getProjectUnits, getProjectUnitCounts } from "@/lib/projects/queries";
import { OG_IMAGES, OG_IMAGE_URL } from "@/lib/site/seo";

// Same reasoning as /projects: published/unpublished state can change
// independently of any build, and an unpublished or invalid slug must 404
// rather than serve a stale cached page.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { slug: string } }) {
   const project = await getProjectBySlug(params.slug);
   if (!project) {
      return { title: "Project Not Found | Property Planet" };
   }
   const title = project.seoTitle ?? `${project.title} | Property Planet`;
   const description = project.seoDescription ?? project.overview ?? undefined;
   const url = `https://propertyplanet.in/projects/${project.slug}`;

   return {
      title,
      description,
      alternates: { canonical: url },
      openGraph: {
         title,
         description,
         url,
         type: "website",
         siteName: "Property Planet",
         // Only the project's own gallery image — never a buyer/seller
         // asset, and never anything from a non-published record.
         images: project.images[0] ? [{ url: project.images[0] }] : OG_IMAGES,
      },
      // SEO fix (Section 20 — Twitter/X Card): see the identical note in
      // src/app/properties/page.tsx. Mirrors the openGraph block above —
      // same real project photo, not the generic homepage favicon.
      twitter: {
         card: "summary_large_image",
         title,
         description,
         images: project.images[0] ? [project.images[0]] : [OG_IMAGE_URL],
      },
   };
}

const ProjectDetailPage = async ({ params }: { params: { slug: string } }) => {
   const project = await getProjectBySlug(params.slug);

   // getProjectBySlug reads from project_public, which already filters to
   // status = 'published' — an unpublished slug returns null here exactly
   // like an invalid one, so both correctly 404 rather than leaking draft
   // content.
   if (!project) {
      notFound();
   }

   // Published units only — getProjectUnits reads property_public, so an
   // unpublished or sold unit is structurally absent rather than filtered.
   const [units, unitCounts] = await Promise.all([getProjectUnits(project.id), getProjectUnitCounts(project.id)]);

   return (
      <Wrapper>
         {/* SEO fix: /projects/[slug] previously had no structured data
             beyond the breadcrumb — PropertyJsonLd existed for individual
             listings but nothing equivalent described the project itself
             (name, location, size, real pricing) to search engines. Built
             only from fields project_public + project_pricing already
             expose on this page — no invented offers/availability. */}
         <ProjectJsonLd project={project} />
         <BreadcrumbJsonLd
            items={[
               { name: "Home", path: "/" },
               { name: "Projects", path: "/projects" },
               { name: project.title, path: `/projects/${project.slug}` },
            ]}
         />
         <HeaderTwo style_1={false} style_2={false} />
         {/* SEO fix (Stage 2 — Visible Breadcrumbs): same items array as
             BreadcrumbJsonLd above. */}
         <BreadcrumbTrail
            items={[
               { name: "Home", path: "/" },
               { name: "Projects", path: "/projects" },
               { name: project.title, path: `/projects/${project.slug}` },
            ]}
         />
         <ProjectDetail project={project} units={units} unitCounts={unitCounts} />
         <FooterOne style={true} />
      </Wrapper>
   );
};

export default ProjectDetailPage;
