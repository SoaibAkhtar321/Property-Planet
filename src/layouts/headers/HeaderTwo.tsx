"use client"
import NavMenu from "./Menu/NavMenu"
import Link from "next/link"
import { useState } from "react"
import UseSticky from "@/hooks/UseSticky"
import LoginModal from "@/modals/LoginModal"
import AuthNav from "./Menu/AuthNav"
import Offcanvas from "./Menu/Offcanvas"
import HeaderSearchbar from "./Menu/HeaderSearchbar"
import AnimatedBrandLogo from "@/components/common/AnimatedBrandLogo"
import { CONTACT_PHONE_DISPLAY, CONTACT_PHONE_HREF } from "@/lib/site/contact"

const HeaderTwo = ({ style_1, style_2 }: any) => {
   const { sticky } = UseSticky();
   const [offCanvas, setOffCanvas] = useState<boolean>(false);
   const [isSearch, setIsSearch] = useState<boolean>(false);

   return (
      <>
         <div className={`theme-main-menu menu-overlay sticky-menu ${style_2 ? "menu-style-four" : style_1 ? "menu-style-three" : "menu-style-two"} ${sticky ? "fixed" : ""}`}>
            <div className={`inner-content ${style_2 ? "gap-two" : "gap-one"}`}>
               <div className="top-header position-relative">
                  <div className="d-flex align-items-center">
                     <div className="logo order-lg-0">
                        <Link href="/" className="d-flex align-items-center">
                           <AnimatedBrandLogo />
                        </Link>
                     </div>

                     <div className="right-widget ms-auto me-3 me-lg-0 order-lg-3">
                        <ul className="d-flex align-items-center style-none">
                           {!style_2 ? (<><li className="d-none d-lg-flex align-items-center me-4">
                              {/* Phase 20: real business number, tel: on every
                                  device that supports it. One placement in the
                                  header, one in the footer, one in the inquiry
                                  success state — deliberately not on every card. */}
                              <a href={CONTACT_PHONE_HREF} className="pp-call-link">
                                 <i className="bi bi-telephone-fill" aria-hidden="true"></i>
                                 <span>{CONTACT_PHONE_DISPLAY}</span>
                              </a>
                           </li>
                              <AuthNav />
                              <li className="pp-header-menu-btn">
                                 {/* Phase 2: fa-bars-filter (a "filter" glyph, three
                                     unequal-width lines with dots) reads as a filter
                                     control, not a menu trigger, and had no
                                     accessible name once the "Menu" text hides
                                     below 576px. Swapped for bootstrap-icons'
                                     bi-list -- a plain three-line hamburger already
                                     used elsewhere in this codebase -- plus proper
                                     aria attributes tied to the offcanvas panel. */}
                                 <button
                                    onClick={() => setOffCanvas(true)}
                                    style={{ cursor: "pointer" }}
                                    className="btn-one d-inline-flex align-items-center"
                                    type="button"
                                    aria-label="Open menu"
                                    aria-haspopup="true"
                                    aria-expanded={offCanvas}
                                    aria-controls="sideNav"
                                 >
                                    <i className="bi bi-list" aria-hidden="true"></i> <span className="d-none d-sm-inline">Menu</span>
                                 </button>
                              </li></>) : (<>
                                 <li className="d-none d-md-flex align-items-center login-btn-one me-4 me-xxl-5">
                                    <i className="fa-regular fa-phone-volume" aria-hidden="true"></i>
                                    <a href={CONTACT_PHONE_HREF} className="tran3s">{CONTACT_PHONE_DISPLAY}</a>
                                 </li>
                                 <AuthNav style_2 />
                                 <li>
                                    <a onClick={() => setIsSearch(true)} style={{ cursor: "pointer" }} className="search-btn-one rounded-circle tran3s d-flex align-items-center justify-content-center"><i className="bi bi-search"></i></a>
                                 </li>
                              </>)}
                        </ul>
                     </div>

                     <nav className="navbar navbar-expand-lg p0 ms-lg-4 order-lg-2">
                        {/* Phase 2: no separate hamburger here. Below lg, the
                            "Menu" button above (right-widget) already opens
                            Offcanvas as the single mobile nav trigger -- a
                            second toggler for this collapse would be a
                            duplicate menu system opening a different panel.
                            This collapse now only needs to show/hide with
                            the lg breakpoint itself, which navbar-expand-lg
                            already does. */}
                        <div className={`collapse navbar-collapse ${style_2 ? "ms-xl-5" : ""}`} id="navbarNav">
                           <NavMenu />
                        </div>
                     </nav>
                  </div>
               </div>
            </div>
         </div>

         <Offcanvas offCanvas={offCanvas} setOffCanvas={setOffCanvas} />
         <LoginModal />
         <HeaderSearchbar isSearch={isSearch} setIsSearch={setIsSearch} />
      </>
   )
}

export default HeaderTwo
