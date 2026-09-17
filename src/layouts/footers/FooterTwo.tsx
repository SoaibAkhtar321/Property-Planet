"use client"
import Image from "next/image"
import Link from "next/link";

import footerLogo_1 from "@/assets/images/logo/logo_05.svg"
import footerShape_1 from "@/assets/images/shape/shape_46.svg"
import footerShape_2 from "@/assets/images/shape/shape_47.svg"
import footerIcon_1 from "@/assets/images/icon/icon_30.svg"
import footerIcon_2 from "@/assets/images/icon/icon_31.svg"
import footer_data from "@/data/home-data/FooterData";
import { CONTACT_EMAIL, CONTACT_PHONE_DISPLAY, CONTACT_PHONE_HREF, SOCIAL_LINKS } from "@/lib/site/contact";

interface ContentType {
   title: string;
   desc_1: string;
   desc_2: string;
}

// SEO fix (Stage 2 — Trust Signals / Local SEO): this component is live on
// /about_us_02 and previously showed a placeholder email ("Emile@gmail.com"),
// a placeholder phone ("+210 0000-0000") and three social icons that all
// linked to "#" — fake business information on a real, published page.
// FooterOne already solved this correctly (src/layouts/footers/FooterOne.tsx)
// by reading from the single verified source of truth in
// src/lib/site/contact.ts; this brings FooterTwo in line with the same
// pattern instead of inventing new placeholder values.
const footer_content: ContentType = {
   title: "Our Newsletter",
   desc_1: "Get instant news by subscribe to our newsletter",
   desc_2: "Hyderabad, Telangana",
}

const { title, desc_1, desc_2 } = footer_content;

const FooterTwo = () => {
   return (
      <div className="footer-two">
         <div className="container container-large">
            <div className="bg-wrapper position-relative z-1">
               <div className="news-letter-area">
                  <div className="row align-items-center">
                     <div className="col-lg-6">
                        <div className="text-center text-lg-start md-mb-20">
                           <h2>{title}</h2>
                           <p className="fs-20 m0">{desc_1}</p>
                        </div>
                     </div>
                     <div className="col-lg-6">
                        <div className="form-wrapper me-auto ms-auto me-lg-0">
                           <form onSubmit={(e) => e.preventDefault()}>
                              <input type="email" placeholder="Your email address" />
                              <button><i className="fa-light fa-arrow-right-long"></i></button>
                           </form>
                        </div>
                     </div>
                  </div>
               </div>
               
               <div className="row justify-content-between">
                  <div className="col-xl-3">
                     <div className="footer-intro position-relative z-1 pt-70 pb-150 lg-pb-20">
                        <div className="logo mb-15">
                           <Link href="/">
                              <Image src={footerLogo_1} alt="" />
                           </Link>
                        </div>
                        <p className="mb-45 lg-mb-30 pe-2 pe-lg-5">{desc_2}</p>
                        <ul className="style-none contact-info">
                           <li className="d-flex align-items-center">
                              <Image src={footerIcon_1} alt="" width="20" />
                              <Link href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</Link>
                           </li>
                           <li className="d-flex align-items-center">
                              <Image src={footerIcon_2} alt="" width="20" />
                              <a href={CONTACT_PHONE_HREF}>{CONTACT_PHONE_DISPLAY}</a>
                           </li>
                        </ul>

                        {SOCIAL_LINKS.length > 0 && (
                           <ul className="style-none d-flex align-items-center social-icon">
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
                        <Image src={footerShape_1} alt="" className="lazy-img shapes shape_01 d-none d-xl-block" />
                     </div>
                  </div>

                  <div className="col-xl-9">
                     <div className="ms-xxl-5 ps-xl-5 mt-200 lg-mt-20">
                        <div className="row justify-content-between">
                           {footer_data.filter((items) => items.page === "home_3").map((item) => (
                              <div key={item.id} className={`${item.widget_class} col-lg-3 col-md-4`}>
                                 <div className="footer-nav pt-30">
                                    <h5 className="footer-title">{item.widget_title}</h5>
                                    <ul className="footer-nav-link style-none">
                                       {item.footer_link.map((li, i) => (
                                          <li key={i}><Link href={li.link}>{li.link_title}</Link></li>
                                       ))}
                                    </ul>
                                 </div>
                              </div>
                           ))}
                           <div className="col-xxl-3 col-lg-2 d-none d-lg-block">
                              <Image src={footerShape_2} alt="" className="lazy-img mt-50" />
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            </div>

            <div className="bottom-footer">
               <div className="d-md-flex justify-content-center justify-content-md-between align-items-center">
                  {/* SEO fix (Stage 2 — Broken Internal Links): both of these
                      previously pointed at /faq instead of the actual
                      privacy/terms pages that already exist on the site. */}
                  <ul className="style-none bottom-nav d-flex flex-wrap justify-content-center">
                     <li><Link href="/privacy-policy">Privacy Policy</Link></li>
                     <li><Link href="/terms-of-service">Terms &amp; Conditions</Link></li>
                     <li><Link href="/contact">Contact Us</Link></li>
                  </ul>
                  <p className="mb-15 text-center text-lg-start order-md-first">Copyright @{new Date().getFullYear()} Property Planet.</p>
               </div>
            </div>
         </div>
      </div>
   )
}

export default FooterTwo
