import Link from "next/link"
import BreadcrumbOne from "@/components/common/breadcrumb/BreadcrumbOne"
import { CONTACT_EMAIL, CONTACT_PHONE_DISPLAY } from "@/lib/site/contact"

const LAST_UPDATED = "17 September 2026"

const TermsOfServiceArea = () => {
   return (
      <>
         <BreadcrumbOne title="Terms of Service" sub_title="Terms of Service" />
         <div className="legal-page-content pt-100 xl-pt-80 pb-150 xl-pb-100">
            <div className="container">
               <div className="row">
                  <div className="col-xxl-8 col-xl-9 col-lg-10 m-auto">
                     <p className="text-muted mb-40">Last updated: {LAST_UPDATED}</p>

                     <p>
                        These Terms of Service (&quot;Terms&quot;) govern your use of the Property Planet
                        website and platform (the &quot;Service&quot;), operated from Hyderabad, Telangana,
                        India. By creating an account, browsing listings, or submitting an enquiry, you agree
                        to these Terms. If you do not agree, please do not use the Service.
                     </p>

                     <h4 className="mt-50 mb-20">1. What Property Planet Is</h4>
                     <p>Property Planet is an online platform that lists properties — primarily plots and
                        land, alongside villas and apartments — and connects buyers with the sellers and
                        agents who list them. <strong>Property Planet is not a licensed real-estate broker,
                        agent, or party to any transaction.</strong> We do not own, inspect, value, or
                        guarantee any property listed on the Service, and we are not involved in negotiating,
                        financing, or completing any sale.</p>

                     <h4 className="mt-50 mb-20">2. Accounts and Roles</h4>
                     <p><strong>Buyers</strong> sign in with Google. <strong>Sellers/agents</strong> register
                        with an email and password and must confirm their email before listing anything. Every
                        listing submitted by a seller/agent is reviewed before it is published; publication does
                        not mean Property Planet has verified the property, its title, or the seller&apos;s
                        right to sell it. You are responsible for keeping your account credentials secure and
                        for all activity under your account.</p>

                     <h4 className="mt-50 mb-20">3. Listings Are User-Submitted</h4>
                     <p>All property details, pricing, photos and descriptions are submitted by the seller or
                        agent who lists them. We take reasonable moderation steps, but we do not independently
                        verify ownership, title, legal status, or the accuracy of any listing. Buyers should
                        independently verify all details — including ownership documents, approvals and
                        boundaries — before making any decision, and we strongly recommend involving a
                        qualified lawyer before any transaction.</p>

                     <h4 className="mt-50 mb-20">4. Enquiries and Contact</h4>
                     <p>When you submit an enquiry (about a listing, a project, or through our general contact
                        form), the details you provide are shared with the relevant seller/agent, our team, or
                        both, so they can follow up with you. You are responsible for the accuracy of the
                        contact details you submit.</p>

                     <h4 className="mt-50 mb-20">5. Acceptable Use</h4>
                     <p>You agree not to:</p>
                     <ul className="style-none list-style-disc ps-3">
                        <li>List a property you do not have the right to list, or post false, misleading or fraudulent information;</li>
                        <li>Use the Service to harass, spam, or send unsolicited commercial messages to other users;</li>
                        <li>Attempt to bypass, scrape, or interfere with the Service&apos;s security, moderation, or normal operation;</li>
                        <li>Use the Service for any unlawful purpose.</li>
                     </ul>
                     <p>We may suspend or terminate accounts that violate these Terms, remove listings that
                        breach them, or refuse service at our discretion.</p>

                     <h4 className="mt-50 mb-20">6. Intellectual Property</h4>
                     <p>The Property Planet name, logo, and platform design are our property. Content you
                        submit (listing details, photos, messages) remains yours, but by submitting it you
                        grant us a license to display and use it as needed to operate the Service — for
                        example, showing your listing to buyers.</p>

                     <h4 className="mt-50 mb-20">7. Disclaimers &amp; Limitation of Liability</h4>
                     <p>The Service is provided &quot;as is&quot;, without warranties of any kind. We do not
                        guarantee that any listing is accurate, available, or that any transaction will be
                        completed. To the maximum extent permitted by law, Property Planet and its team are not
                        liable for any loss or damage arising from your use of the Service, reliance on a
                        listing, or dealings with any buyer, seller or agent you connect with through it.</p>

                     <h4 className="mt-50 mb-20">8. Third-Party Services</h4>
                     <p>The Service relies on third-party providers, including Google (sign-in and maps) and
                        Supabase (hosting and authentication). Your use of those features is also subject to
                        the respective provider&apos;s own terms.</p>

                     <h4 className="mt-50 mb-20">9. Changes to These Terms</h4>
                     <p>We may update these Terms from time to time. Material changes will be reflected by
                        updating the &quot;Last updated&quot; date above. Continued use of the Service after
                        changes take effect constitutes acceptance of the revised Terms.</p>

                     <h4 className="mt-50 mb-20">10. Governing Law</h4>
                     <p>These Terms are governed by the laws of India, and any disputes will be subject to the
                        exclusive jurisdiction of the courts in Hyderabad, Telangana.</p>

                     <h4 className="mt-50 mb-20">11. Contact Us</h4>
                     <p>
                        Questions about these Terms? Reach us at{" "}
                        <Link href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</Link> or call{" "}
                        {CONTACT_PHONE_DISPLAY}.
                     </p>
                  </div>
               </div>
            </div>
         </div>
      </>
   )
}

export default TermsOfServiceArea
