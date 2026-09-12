"use client"
import NavMenu from "./Menu/NavMenu"
import Link from "next/link"
import Image from "next/image"
import UseSticky from "@/hooks/UseSticky"
import LoginModal from "@/modals/LoginModal"
import AuthNav from "./Menu/AuthNav"
import BecomeSellerNav from "./Menu/BecomeSellerNav"

import logo_1 from "@/assets/images/logo/logo_01.svg";

const HeaderOne = ({ style }: any) => {
   const { sticky } = UseSticky();

   return (
      <>
         <header className={`theme-main-menu menu-overlay menu-style-one sticky-menu ${sticky ? "fixed" : ""}`}>
            <div className="inner-content gap-one">
               <div className="top-header position-relative">
                  <div className="d-flex align-items-center justify-content-between">
                     <div className="logo order-lg-0">
                        <Link href="/" className="d-flex align-items-center">
                           <Image src={logo_1} alt="" />
                        </Link>
                     </div>
                     <div className="right-widget ms-auto ms-lg-0 me-3 me-lg-0 order-lg-3">
                        <ul className="d-flex align-items-center style-none">
                           <AuthNav />
                           <li className="d-none d-md-inline-block ms-3">
                              <BecomeSellerNav className="btn-two" />
                           </li>
                        </ul>
                     </div>
                     <nav className="navbar navbar-expand-lg p0 order-lg-2">
                        <button className="navbar-toggler d-block d-lg-none" type="button" data-bs-toggle="collapse"
                           data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false"
                           aria-label="Toggle navigation">
                           <span></span>
                        </button>
                        <div className="collapse navbar-collapse" id="navbarNav">
                           <NavMenu />
                        </div>
                     </nav>
                  </div>
               </div>
            </div>
         </header>
         <LoginModal />
      </>
   )
}

export default HeaderOne
