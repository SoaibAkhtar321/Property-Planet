"use client"

// Same combined-screen flow as the seller's AddPropertyBody: a placeholder
// draft row is created silently on mount (initDraftAdminProperty) so the
// photo uploader has a real property id from the start, instead of the
// old "media upload isn't available yet — add photos after creating the
// listing" placeholder. Everything — details, photos, and the
// publish-now choice — is filled in on one screen, and a single submit
// (updateAdminProperty, then optionally setAdminPropertyStatus) finalizes
// it all at once.

import { useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Overview from "@/components/dashboard/add-property/Overview"
import ListingDetails from "@/components/dashboard/add-property/ListingDetails"
import PropertyLocation from "@/components/dashboard/add-property/PropertyLocation"
import AdminPropertyMediaUpload from "@/components/admin/properties/AdminPropertyMediaUpload"
import { initDraftAdminProperty, updateAdminProperty, setAdminPropertyStatus, addAdminPropertyMedia } from "@/lib/admin/properties/actions"

const NewAdminPropertyForm = ({ error }: { error?: string }) => {
   const router = useRouter()
   const [draftId, setDraftId] = useState<string | null>(null)
   const [initError, setInitError] = useState<string | null>(null)
   const [submitError, setSubmitError] = useState<string | null>(null)
   const [isSubmitting, setIsSubmitting] = useState(false)
   const [, startTransition] = useTransition()

   useEffect(() => {
      let cancelled = false
      startTransition(async () => {
         const result = await initDraftAdminProperty()
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

      const result = await updateAdminProperty(draftId, formData)
      if (!result.success) {
         setSubmitError(result.error ?? "Could not save listing.")
         setIsSubmitting(false)
         return
      }

      const publishNow = formData.get("publish_now") === "on"
      if (publishNow) {
         const publishResult = await setAdminPropertyStatus(draftId, "published")
         if (!publishResult.success) {
            setSubmitError(publishResult.error ?? "Saved, but could not publish.")
            setIsSubmitting(false)
            return
         }
      }

      router.push(`/admin/properties/${draftId}`)
   }

   const addMedia = draftId ? addAdminPropertyMedia.bind(null, draftId) : null

   return (
      <div>
         <h3 className="mb-4">Add Listing</h3>

         {(error || initError || submitError) && (
            <div className="alert alert-danger">{submitError ?? initError ?? error}</div>
         )}

         {!draftId || !addMedia ? (
            <div className="bg-white card-box border-20">Setting up the listing…</div>
         ) : (
            <form action={handleSubmit}>
               <Overview />
               <ListingDetails />
               <PropertyLocation />

               <div className="bg-white card-box border-20 mt-40">
                  <h4 className="dash-title-three">Photo & Video Attachment</h4>
                  <p className="fs-14 opacity-65 mb-20">Add photos now — they&apos;ll be attached to this listing right away.</p>
                  <AdminPropertyMediaUpload propertyId={draftId} nextSortOrder={0} addMediaAction={addMedia} />
               </div>

               <div className="bg-white card-box border-20 mt-40">
                  <div className="form-check">
                     <input className="form-check-input" type="checkbox" id="publish_now" name="publish_now" />
                     <label className="form-check-label" htmlFor="publish_now">
                        Publish immediately (skip draft/review — admin listings can go live directly)
                     </label>
                  </div>
               </div>

               <div className="button-group d-inline-flex align-items-center mt-30">
                  <button type="submit" className="dash-btn-two tran3s me-3" disabled={isSubmitting}>
                     {isSubmitting ? "Saving…" : "Save & Publish"}
                  </button>
               </div>
            </form>
         )}
      </div>
   )
}

export default NewAdminPropertyForm
