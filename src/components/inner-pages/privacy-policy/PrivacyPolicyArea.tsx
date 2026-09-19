import Link from "next/link"
import BreadcrumbOne from "@/components/common/breadcrumb/BreadcrumbOne"
import { CONTACT_EMAIL, CONTACT_PHONE_DISPLAY } from "@/lib/site/contact"

// OWNER-REVIEW: this policy was written from what the application actually
// does and has NOT had legal review. Before relying on it, the owner should
// confirm: (1) the legal entity name and registered address to state here,
// (2) any grievance-officer / data-protection contact required for an Indian
// online platform, (3) retention periods, (4) whether a consent notice is
// needed for the embedded Google Maps on the Contact page.
const LAST_UPDATED = "20 September 2026"

const PrivacyPolicyArea = () => {
   return (
      <>
         <BreadcrumbOne title="Privacy Policy" sub_title="Privacy Policy" />
         <div className="legal-page-content pt-100 xl-pt-80 pb-150 xl-pb-100">
            <div className="container">
               <div className="row">
                  <div className="col-xxl-8 col-xl-9 col-lg-10 m-auto">
                     <p className="text-muted mb-40">Last updated: {LAST_UPDATED}</p>

                     <p>
                        Property Planet (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) operates the Property
                        Planet website and platform (the &quot;Service&quot;), connecting property buyers with
                        sellers and agents, primarily for plots, land, villas and apartments. This Privacy
                        Policy explains what information we collect, how we use it, and the choices you have.
                        By using the Service, you agree to the collection and use of information as described
                        here.
                     </p>

                     <h4 className="mt-50 mb-20">1. Information We Collect</h4>
                     <p><strong>Account information.</strong> If you sign in as a buyer, we use Google Sign-In
                        (via our authentication provider, Supabase) and receive your name, email address and
                        Google profile photo from your Google account. If you register as a seller or agent,
                        you provide your name, email address and password directly, and confirm your email
                        before your account is activated.</p>
                     <p><strong>Enquiry information.</strong> When you send an enquiry about a property, a
                        project, or through our general contact form, we collect the name, phone number, and
                        (for the general contact form) email address you provide with that enquiry, along with
                        any message, preferred date and preferred time you choose to add.</p>
                     <p><strong>Listing information.</strong> If you list a property as a seller or agent, we
                        collect the property details, location, media and pricing you submit, along with your
                        contact details so buyers whose visits are confirmed can reach you.</p>
                     <p><strong>Location information.</strong> Property listings include an approximate map
                        location, shown to all visitors, and an exact address, which is only revealed to a
                        buyer once specific conditions are met (for example, a confirmed site visit) — see
                        &quot;How We Share Information&quot; below.</p>
                     <p><strong>Usage information.</strong> Like most websites, our hosting infrastructure automatically logs standard technical data such as IP address, browser type, device information and pages visited, used to keep the Service secure and working correctly. We do not currently use a third-party analytics or advertising service.</p>
                     <p><strong>Assistance requests.</strong> If you ask for help finding or visiting a
                        property through the on-site assistance prompt, we record your request, the property
                        it relates to and the contact details you provide. These requests are handled by our
                        own team and are not passed to sellers as ordinary enquiries.</p>
                     <p><strong>AI assistant.</strong> The Property Planet AI assistant answers questions
                        using our published listings. Your questions are processed on our servers to produce a
                        reply and are not saved to our database, and we do not send them to an external AI
                        provider.</p>

                     <h4 className="mt-50 mb-20">2. How We Use Your Information</h4>
                     <ul className="style-none list-style-disc ps-3">
                        <li>To create and manage your account, and to tell buyers, sellers and admins apart so each sees only what they should.</li>
                        <li>To connect a buyer&apos;s enquiry with the right seller or agent, and to let our team follow up on leads.</li>
                        <li>To let sellers and agents publish, manage and moderate property and project listings.</li>
                        <li>To send transactional communications — enquiry confirmations, sign-in emails, and updates about a lead or listing you&apos;re party to.</li>
                        <li>To detect abuse, prevent fraud, and keep the Service secure.</li>
                        <li>To improve the Service based on how it is actually used.</li>
                     </ul>
                     <p>We do not sell your personal information to third parties.</p>

                     <h4 className="mt-50 mb-20">3. How We Share Information</h4>
                     <p><strong>With sellers/agents.</strong> When you enquire about a listing, the phone
                        number and name you submit with that enquiry are shared with the property&apos;s
                        seller/agent so they can contact you. A property&apos;s exact location is only revealed
                        to the specific buyer whose enquiry qualifies (e.g. a confirmed site visit), never
                        published to buyers generally.</p>
                     <p><strong>Service providers.</strong> We use third-party providers to run the Service,
                        including Supabase (authentication and database hosting), Google (Google Sign-In and Google Maps, for account sign-in and displaying property locations), OpenStreetMap (map tiles on our homepage map, which receive your IP address when loaded), and EmailJS (for delivering contact-form messages). These providers process data on our behalf and are
                        bound by their own privacy and security terms.</p>
                     <p><strong>Legal requirements.</strong> We may disclose information if required by law,
                        or to protect the rights, property or safety of Property Planet, our users, or the
                        public.</p>
                     <p>We do not share your information with advertisers or data brokers.</p>

                     <h4 className="mt-50 mb-20">4. Cookies</h4>
                     <p>We use essential cookies to keep you signed in. Your browser&apos;s local and session
                        storage is also used for small preferences, such as remembering that you dismissed an
                        on-site prompt or that a page animation has already played. We do not currently use
                        third-party advertising or tracking cookies. Embedded content from Google Maps may set
                        its own cookies when it loads; see Google&apos;s policies.</p>

                     <h4 className="mt-50 mb-20">5. Data Retention</h4>
                     <p>We retain account, listing and enquiry information for as long as your account is
                        active or as needed to provide the Service, resolve disputes, and meet our legal
                        obligations. You can request deletion of your account and associated data at any
                        time — see &quot;Your Rights&quot; below.</p>

                     <h4 className="mt-50 mb-20">6. Your Rights</h4>
                     <p>Depending on where you live, you may have rights to access, correct, export, or
                        delete your personal information, and to withdraw consent where processing is based on
                        consent. To exercise any of these rights, contact us using the details below and we
                        will respond as required by applicable law.</p>

                     <h4 className="mt-50 mb-20">7. Children&apos;s Privacy</h4>
                     <p>The Service is not directed at children under 18, and we do not knowingly collect
                        personal information from them. If you believe a child has provided us with personal
                        information, please contact us and we will remove it.</p>

                     <h4 className="mt-50 mb-20">8. Data Security</h4>
                     <p>We use industry-standard measures — including row-level access controls on our
                        database and encrypted connections — to protect your information. No method of
                        transmission or storage is 100% secure, and we cannot guarantee absolute security.</p>

                     <h4 className="mt-50 mb-20">9. Changes to This Policy</h4>
                     <p>We may update this Privacy Policy from time to time. Material changes will be
                        reflected by updating the &quot;Last updated&quot; date above. Continued use of the
                        Service after changes take effect constitutes acceptance of the revised policy.</p>

                     <h4 className="mt-50 mb-20">10. Contact Us</h4>
                     <p>
                        If you have questions about this Privacy Policy or how we handle your information,
                        reach out to us at{" "}
                        <Link href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</Link> or call{" "}
                        {CONTACT_PHONE_DISPLAY}.
                     </p>
                     {/* OWNER-REVIEW: no verified physical/registered address exists in the project
                         (src/lib/site/contact.ts). Add one here only once supplied by the owner. */}
                  </div>
               </div>
            </div>
         </div>
      </>
   )
}

export default PrivacyPolicyArea
