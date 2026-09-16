import Link from "next/link";
import NewAdminPropertyForm from "@/components/admin/properties/NewAdminPropertyForm";

export const metadata = {
   title: "Property Planet — Admin Add Listing",
};

// The form itself (details + photos + publish-now, all on one screen) is
// a client component — see NewAdminPropertyForm — because it needs to
// create a placeholder draft row on mount before the photo uploader can
// attach anything to it. This file stays a server component only for the
// static header/metadata and the ?error= passthrough from a failed submit.
export default async function NewAdminPropertyPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
   const { error } = await searchParams;

   return (
      <div>
         <div className="mb-4">
            <Link href="/admin/properties">&larr; Back to properties</Link>
         </div>
         <NewAdminPropertyForm error={error} />
      </div>
   );
}
