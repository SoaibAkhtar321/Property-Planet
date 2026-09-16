import Image from "next/image"
import Link from "next/link"
import footer_data from "@/data/home-data/FooterData"
import BrandLogo from "@/components/common/BrandLogo"
import { CONTACT_EMAIL, CONTACT_PHONE_DISPLAY, CONTACT_PHONE_HREF, SOCIAL_LINKS } from "@/lib/site/contact"

import footerShape_1 from "@/assets/images/shape/shape_32.svg"
import footerShape_2 from "@/assets/images/shape/shape_33.svg"

// Phase 20: the old placeholder row (facebook / twitter / instagram, all
// pointing at "#") is replaced by the verified accounts in
// src/lib/site/contact.ts. Unverified networks are simply not rendered
// rather than linking nowhere.

const FooterOne = ({ style }: any) => {
   return (
      <div className={`footer-one ${style ? "dark-bg" : ""}`}>
         <div className="position-relative z-1">
            <div className="container">
               <div className="row justify-content-between">
                  <div className="col-lg-4">
                     <div className={`footer-intro ${style ? "position-relative z-1" : ""}`}>
                        <div className="bg-wrapper">
                           <div className="logo mb-20">
                              <Link href="/">
                                 <BrandLogo animate={false} variant={style ? "dark" : "light"} />
                              </Link>
                           </div>
                           <p className="mb-20 lg-mb-15 md-mb-10">Hyderabad, Telangana</p>
                           <h6>CONTACT</h6>
                           <Link href={`mailto:${CONTACT_EMAIL}`} className={`email tran3s mb-10 ${style ? "font-garamond" : "fs-24 text-decoration-underline"}`}>{CONTACT_EMAIL}</Link>
                           <a href={CONTACT_PHONE_HREF} className="pp-call-link fs-20 mb-30 d-flex">
                              <i className="bi bi-telephone-fill" aria-hidden="true"></i>
                              <span>{CONTACT_PHONE_DISPLAY}</span>
                           </a>
                           {SOCIAL_LINKS.length > 0 && (
                              <ul className="style-none d-flex align-items-center social-icon mb-30">
                                 {SOCIAL_LINKS.map((social) => (
                                    <li key={social.name}>
                                       <a
                                          href={social.href}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          aria-label={`Property Planet on ${social.name}`}
                                       >
                                          <i className={`fa-brands fa${style ? "" : "-square"}-${social.icon}`} aria-hidden="true"></i>
                                       </a>
                                    </li>
                                 ))}
                              </ul>
                           )}
                           <p className="fs-14 opacity-75 lh-md">Property Planet is a technology and facilitation platform. Buyers should independently verify original title documents and legal status before any transaction.</p>
                        </div>
                        {style && <Image src={footerShape_1} alt="" className="lazy-img shapes shape_01" />}
                     </div>
                  </div>

                  <div className="col-lg-8">
                     <div className={`d-flex flex-wrap ${style ? "h-100" : ""}`}>
                        {footer_data.filter((items) => items.page === "home_1").map((item) => (
                           <div key={item.id} className={`footer-nav mt-100 lg-mt-80 ${item.widget_class}`}>
                              <h5 className={`footer-title ${style ? "text-white" : ''}`}>{item.widget_title}</h5>
                              <ul className="footer-nav-link style-none">
                                 {item.footer_link.map((li, i) => (
                                    <li key={i}><Link href={li.link}>{li.link_title}</Link></li>
                                 ))}
                              </ul>
                           </div>
                        ))}
                     </div>
                  </div>
               </div>
            </div>
            {style && <Image src={footerShape_2} alt="" className="lazy-img shapes shape_02" />}
         </div>
      </div>
   )
}

export default FooterOne
