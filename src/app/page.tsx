import Wrapper from "@/layouts/Wrapper";
import HeaderTwo from "@/layouts/headers/HeaderTwo";
import FooterOne from "@/layouts/footers/FooterOne";
import PropertiesListing from "@/components/properties/PropertiesListing";
import { getPublishedProperties } from "@/lib/properties/queries";

// Always fetch fresh — published inventory changes independently of any
// build, and this route reads through Supabase (RLS-scoped to published
// rows only), not local demo data.
export const dynamic = "force-dynamic";

export const metadata = {
   title: "Properties | Property Planet",
};

const PropertiesPage = async ({
   searchParams,
}: {
   searchParams: { location?: string };
}) => {
   const properties = await getPublishedProperties();

   return (
      <Wrapper>
         <HeaderTwo style_1={false} style_2={false} />
         <PropertiesListing items={properties} initialLocation={searchParams.location} />
         <FooterOne style={true} />
      </Wrapper>
   );
};

export default PropertiesPage;
