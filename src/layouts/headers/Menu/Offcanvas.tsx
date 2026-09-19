"use client"
import Link from "next/link"
import { CONTACT_EMAIL, CONTACT_PHONE_DISPLAY, CONTACT_PHONE_HREF, SOCIAL_LINKS } from "@/lib/site/contact"

import BrandLogo from "@/components/common/BrandLogo";

// Phase 20: this panel is opened by the "Menu" button in the live header,
// so everything in it was public. It previously showed three fabricated
// template listings — "FOR RENT", "$2210 / m", "6391 Elgin St. Celina" —
// plus a Dhaka postal address, a US phone number and WhatsApp / X / Viber
// icons linking to "#".
//
// All of it is removed:
//   - the fake listings (invented inventory advertising a rental product
//     Property Planet does not offer, on a page selling real property);
//   - the placeholder address and phone, replaced with the real business
//     number as a tel: link;
//   - the unverified social accounts, replaced by the one verified account
//     in src/lib/site/contact.ts.
//
// What replaces the listing block is navigation that actually goes
// somewhere: the real discovery routes. No Send Inquiry here — this is
// navigation, and an enquiry needs a specific property or project.

const quickLinks: { label: string; href: string; desc: string }[] = [
   { label: "Properties", href: "/properties", desc: "Verified plots, land, villas and apartments for sale" },
   { label: "Projects", href: "/projects", desc: "Developments and their available units" },
   { label: "Insights", href: "/blog", desc: "Market notes from the Property Planet team" },
   { label: "Become a Seller", href: "/sell-property", desc: "List your land or property with us" },
   { label: "Contact", href: "/contact", desc: "Talk to an advisor" },
]

const Offcanvas = ({ offCanvas, setOffCanvas }: any) => {
   return (
      <>
         <div className={`offcanvas offcanvas-end sidebar-nav ${offCanvas ? "show" : ""}`} id="sideNav">
            <div className="offcanvas-header">
               <div className="logo order-lg-0">
                  <Link href="/" className="d-flex align-items-center">
                     <BrandLogo size="menu" />
                  </Link>
               </div>
               <button onClick={() => setOffCanvas(false)} type="button" className="btn-close" data-bs-dismiss="offcanvas" aria-label="Close menu"></button>
            </div>

            <div className="wrapper mt-60">
               <div className="d-flex flex-column h-100">
                  <nav aria-label="Site sections">
                     <h4 className="title pb-25">Explore</h4>
                     <ul className="style-none">
                        {quickLinks.map((link) => (
                           <li key={link.href} className="mb-25">
                              <Link
                                 href={link.href}
                                 onClick={() => setOffCanvas(false)}
                                 className="d-block color-dark fw-500 fs-22"
                              >
                                 {link.label}
                                 <i className="bi bi-arrow-up-right ms-2" aria-hidden="true"></i>
                              </Link>
                              <span className="fs-15 opacity-75">{link.desc}</span>
                           </li>
                        ))}
                     </ul>
                  </nav>

                  <div className="address-block mt-40">
                     <h4 className="title pb-15">Talk to us</h4>
                     <p className="mb-10">Hyderabad, Telangana</p>
                     <p className="mb-10">
                        <a href={CONTACT_PHONE_HREF} className="pp-call-link fs-20">
                           <i className="bi bi-telephone-fill" aria-hidden="true"></i>
                           <span>{CONTACT_PHONE_DISPLAY}</span>
                        </a>
                     </p>
                     <p>
                        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
                     </p>
                  </div>

                  {SOCIAL_LINKS.length > 0 && (
                     <ul className="style-none d-flex flex-wrap w-100 align-items-center gap-4 social-icon pt-25 mt-auto">
                        {SOCIAL_LINKS.map((social) => (
                           <li key={social.name}>
                              <a
                                 href={social.href}
                                 target="_blank"
                                 rel="noopener noreferrer"
                                 aria-label={`Property Planet on ${social.name}`}
                              >
                                 <i className={`fa-brands fa-${social.icon}`} aria-hidden="true"></i>
                              </a>
                           </li>
                        ))}
                     </ul>
                  )}
               </div>
            </div>
         </div>
         <div onClick={() => setOffCanvas(false)} className={`offcanvas-backdrop fade ${offCanvas ? "show" : ""}`}></div>
      </>
   )
}

export default Offcanvas
