import { redirect } from "next/navigation"
import EditPropertyBody from "./EditPropertyBody"
import { getOwnPropertyById, getOwnPropertyMedia } from "@/lib/properties/queries"
import { updatePropertyListing } from "@/lib/properties/actions"

const DashboardEditProperty = async ({ id, error }: { id: string; error?: string }) => {
   const property = await getOwnPropertyById(id);
   const media = property ? await getOwnPropertyMedia(property.id) : [];

   // Wrapped here (a server component) rather than inline in
   // EditPropertyBody, which is "use client" and can't declare its own
   // server action. Mirrors createPropertyListing()'s redirect-on-
   // success/error-back-to-form convention.
   const submitUpdate = async (formData: FormData) => {
      "use server";
      const result = await updatePropertyListing(id, formData);
      if (!result.success) {
         redirect(`/dashboard/edit-property/${id}?error=${encodeURIComponent(result.error ?? "Failed to save changes.")}`);
      }
      redirect("/dashboard/properties-list");
   };

   return (
      // Phase 5 fix: same duplicate-sidebar bug as message/index.tsx -- see
      // that file's comment. EditPropertyBody already renders
      // DashboardHeaderTwo, which renders the real, correctly wired
      // DashboardHeaderOne itself.
      <>
         <EditPropertyBody property={property} media={media} error={error} onSubmit={submitUpdate} />
      </>
   )
}

export default DashboardEditProperty
