import Image from "next/image"

import footerLogo from "@/assets/images/logo/logo_06.svg"
import footerShape from "@/assets/images/assets/ils_06.svg"
import Link from "next/link"
import footer_data from "@/data/home-data/FooterData"
import { CONTACT_EMAIL, SOCIAL_LINKS } from "@/lib/site/contact"

const FooterFour = () => {
   return (
      <div className="footer-four position-relative z-1">
         <div className="container container-large">
            <div className="bg-wrapper position-relative z-1">
               <div className="row">
                  <div className="col-xxl-3 col-lg-4 mb-60">
                     <div className="footer-intro">
                        <div className="logo mb-20">
                           <Link href="/">
                              <Image src={footerLogo} alt="" />
                           </Link>
                        </div>
                        <p className="mb-30 xs-mb-20">Hyderabad, Telangana</p>
                        <Link href={`mailto:${CONTACT_EMAIL}`} className="email tran3s mb-60 md-mb-30">{CONTACT_EMAIL}</Link>
                        {/* SEO fix (Stage 2 — Trust Signals): these three
                            icons previously all linked to "#" — dead links on
                            a live page. Same verified-only pattern as
                            FooterOne/FooterTwo: only real, confirmed accounts
                            render, nothing invented for the networks
                            Property Planet doesn't have yet. */}
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
                     </div>
                  </div>

                  {footer_data.filter((items) => items.page === "home_5").map((item) => (
                     <div key={item.id} className={`col-sm-4 mb-30 ${item.widget_class}`}>
                        <div className={`footer-nav ${item.widget_class2}`}>
                           <h5 className="footer-title">{item.widget_title}</h5>
                           <ul className="footer-nav-link style-none">
                              {item.footer_link.map((li, i) => (
                                 <li key={i}><Link href={li.link}>{li.link_title}</Link></li>))}
                           </ul>
                        </div>
                     </div>
                  ))}
               </div>
            </div>
            <div className="bottom-footer">
               <p className="m0 text-center fs-16">Copyright @{new Date().getFullYear()} Property Planet.</p>
            </div>
         </div>
         <Image src={footerShape} alt="" className="lazy-img shapes shape_01" />
      </div>
   )
}

export default FooterFour
