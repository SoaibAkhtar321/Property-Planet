"use client"
import NavMenu from "./Menu/NavMenu"
import Link from "next/link"
import { useState } from "react"
import { useSupabaseUser } from "@/hooks/useSupabaseUser"
import UseSticky from "@/hooks/UseSticky"
import LoginModal from "@/modals/LoginModal"
import AuthNav from "./Menu/AuthNav"
import Offcanvas from "./Menu/Offcanvas"
import HeaderSearchbar from "./Menu/HeaderSearchbar"
import AnimatedBrandLogo from "@/components/common/AnimatedBrandLogo"
import { CONTACT_PHONE_DISPLAY, CONTACT_PHONE_HREF } from "@/lib/site/contact"
import ThemeToggle from "@/components/common/ThemeToggle"

// Mobile/tablet "Become a Seller" button (shown below lg only; desktop already
// has this item in NavMenu). Same session-aware destinations as NavMenu,
// BecomeSellerNav and Offcanvas: logged out -> /seller/login, buyer ->
// /seller/register, seller -> Add Listing, admin -> hidden. It renders nothing
// while the session is resolving, so there is no flash of the wrong label.
const HeaderSellerButton = () => {
   const { user, role, loading } = useSupabaseUser();

   if (loading || role === "admin") return null;

   let href = "/seller/login";
   let label = "Become a Seller";
   if (user && role === "seller") {
      href = "/dashboard/add-property";
      label = "Add Listing";
   } else if (user && role === "buyer") {
      href = "/seller/register";
   }

   return (
      <Link href={href} className="pp-header-seller-btn">
         {label}
      </Link>
   );
};

const HeaderTwo = ({ style_1, style_2, staticHeader = false, overHero = false }: any) => {
   const { sticky } = UseSticky();
   const [offCanvas, setOffCanvas] = useState<boolean>(false);
   const [isSearch, setIsSearch] = useState<boolean>(false);

   // Inner/detail pages (property, project, blog, listing pages) pass
   // staticHeader so the header sits in normal flow with a solid background
   // instead of the homepage's absolute/transparent overlay -- see
   // _header.scss for why. Homepage callers omit the prop and keep the
   // existing menu-overlay behavior untouched.
   //
   // overHero: the homepage passes this explicitly (see HomeTwo/index.tsx)
   // so the "give the header a solid background over the hero" rule no
   // longer depends solely on the CSS `:has(+ .hero-banner-two)` sibling
   // selector -- that rule stays in the stylesheet as a harmless backup,
   // but the actual page that has a hero now says so directly via a plain
   // class, which every browser applies unconditionally and doesn't
   // depend on this exact DOM adjacency ever holding.
   return (
      <>
         <div className={`theme-main-menu sticky-menu ${staticHeader ? "static-header" : "menu-overlay"}${overHero ? " over-hero" : ""} ${style_2 ? "menu-style-four" : style_1 ? "menu-style-three" : "menu-style-two"} ${sticky ? "fixed" : ""}`}>
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
                              <li className="d-lg-none pp-header-seller">
                                 <HeaderSellerButton />
                              </li>
                              <AuthNav />
                              <li className="d-flex align-items-center me-2 me-lg-3">
                                 <ThemeToggle />
                              </li>
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
                                 <li className="d-flex align-items-center me-2">
                                    <ThemeToggle />
                                 </li>
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

         <style jsx global>{`
            .theme-main-menu .pp-header-menu-btn .btn-one {
               /* .btn-one is a shared outline-style button (transparent
                  center, border + text only) used across admin uploads,
                  the dashboard, etc. -- fine on a plain background, but
                  over this header's hero video/photo the transparent
                  center just lets the busy footage show through, making
                  the trigger hard to see. Fill it solid for this one
                  usage instead of touching the shared .btn-one class. */
               background: #ff6725;
               border-color: #ff6725;
               color: #fff;
            }
            .theme-main-menu .pp-header-menu-btn .btn-one:hover,
            .theme-main-menu .pp-header-menu-btn .btn-one:focus-visible {
               background: #e5561a;
               border-color: #e5561a;
               color: #fff;
            }
            .theme-main-menu .pp-header-seller-btn {
               display: inline-flex;
               align-items: center;
               justify-content: center;
               white-space: nowrap;
               background: #ff6725;
               color: #fff;
               border: 1px solid #ff6725;
               border-radius: 10px;
               font-size: 13px;
               font-weight: 500;
               line-height: 1;
               padding: 0 12px;
               height: 36px;
               margin-right: 8px;
               transition: background 0.2s ease, border-color 0.2s ease;
            }
            .theme-main-menu .pp-header-seller-btn:hover,
            .theme-main-menu .pp-header-seller-btn:focus-visible {
               background: #e5561a;
               border-color: #e5561a;
               color: #fff;
            }
            @media (max-width: 575px) {
               .theme-main-menu .pp-header-seller-btn {
                  height: 44px;
                  padding: 0 10px;
                  font-size: 12px;
                  margin-right: 6px;
               }
            }
         `}</style>
      </>
   )
}

export default HeaderTwo