"use client"
import { useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import DashboardHeaderTwo from "@/layouts/headers/dashboard/DashboardHeaderTwo"
import Overview from "./Overview"
import ListingDetails from "./ListingDetails"
import PropertyLocation from "./PropertyLocation"
import PropertyMediaUpload from "./PropertyMediaUpload"
import { initDraftProperty, updatePropertyListing, submitPropertyForReview } from "@/lib/properties/actions"

// One combined screen: fill every field, upload photos, then a single
// "Save & Submit for Review" click — instead of the old two-step flow
// (save text fields -> get redirected -> only then see the uploader).
//
// Photos still need a real property id to upload against (storage_path is
// `{property_id}/...`), so a placeholder draft row is created silently the
// moment this screen mounts (initDraftProperty), before the seller has
// typed anything. That id is what PropertyMediaUpload uses right here, in
// the same form, instead of on a separate screen. The final submit
// (updatePropertyListing) overwrites every placeholder field with what the
// seller actually entered and re-validates it — the draft row's initial
// values are never what gets reviewed or published.
const AddPropertyBody = ({ error }: { error?: string }) => {
   const router = useRouter()
   const [draftId, setDraftId] = useState<string | null>(null)
   const [initError, setInitError] = useState<string | null>(null)
   const [submitError, setSubmitError] = useState<string | null>(null)
   const [isSubmitting, setIsSubmitting] = useState(false)
   const [, startTransition] = useTransition()

   useEffect(() => {
      let cancelled = false
      startTransition(async () => {
         const result = await initDraftProperty()
         if (cancelled) return
         if ("error" in result) setInitError(result.error)
         else setDraftId(result.id)
      })
      return () => {
         cancelled = true
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [])

   const handleSubmit = async (formData: FormData) => {
      if (!draftId) return
      setSubmitError(null)
      setIsSubmitting(true)

      const result = await updatePropertyListing(draftId, formData)
      if (!result.success) {
         setSubmitError(result.error ?? "Could not save listing.")
         setIsSubmitting(false)
         return
      }

      const submitResult = await submitPropertyForReview(draftId)
      if (!submitResult.success) {
         setSubmitError(submitResult.error ?? "Saved, but could not submit for review.")
         setIsSubmitting(false)
         return
      }

      router.push("/dashboard/properties-list")
   }

   return (
      <div className="dashboard-body">
         <div className="position-relative">
            <DashboardHeaderTwo title="Add New Property" />
            <h2 className="main-title d-block d-lg-none">Add New Property</h2>

            {(error || initError || submitError) && (
               <div className="alert alert-danger mb-30" role="alert">
                  {submitError ?? initError ?? error}
               </div>
            )}

            {!draftId ? (
               <div className="bg-white card-box border-20">Setting up your listing…</div>
            ) : (
               <form action={handleSubmit}>
                  <Overview />
                  <ListingDetails />
                  <PropertyLocation />
                  <PropertyMediaUpload propertyId={draftId} initialMedia={[]} />

                  <div className="button-group d-inline-flex align-items-center mt-30">
                     <button type="submit" className="dash-btn-two tran3s me-3" disabled={isSubmitting}>
                        {isSubmitting ? "Saving…" : "Save & Submit for Review"}
                     </button>
                  </div>
                  <p className="fs-14 opacity-65 mt-15">
                     Add your photos above, then submit — it goes to admin for review from here.
                  </p>
               </form>
            )}
         </div>
      </div>
   )
}

export default AddPropertyBody
