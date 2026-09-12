"use client"
import NavMenu from "./Menu/NavMenu"
import Link from "next/link"
import Image from "next/image"
import { useState } from "react"
import UseSticky from "@/hooks/UseSticky"
import LoginModal from "@/modals/LoginModal"
import HeaderSearchbar from "./Menu/HeaderSearchbar"
import AuthNav from "./Menu/AuthNav"
import BecomeSellerNav from "./Menu/BecomeSellerNav"

import logo_1 from "@/assets/images/logo/logo_06.svg";

const HeaderFour = () => {

   const { sticky } = UseSticky();
   const [isSearch, setIsSearch] = useState<boolean>(false);
   
   return (
      <>
         <header className={`theme-main-menu menu-overlay menu-style-six sticky-menu ${sticky ? "fixed" : ""}`}>
            <div className="inner-content gap-two">
               <div className="top-header position-relative">
                  <div className="d-flex align-items-center">
                     <div className="logo order-lg-0">
                        <Link href="/" className="d-flex align-items-center">
                           <Image src={logo_1} alt="" />
                        </Link>
                     </div>

                     <div className="right-widget ms-auto me-3 me-lg-0 order-lg-3">
                        <ul className="d-flex align-items-center style-none">
                           <li className="d-none d-md-inline-block me-4">
                              <BecomeSellerNav className="btn-ten rounded-0" iconClassName="bi bi-arrow-up-right" />
                           </li>
                           <AuthNav style_2 />
                           <li>
                              <a onClick={() => setIsSearch(true)} style={{ cursor: "pointer" }} className="search-btn-one rounded-circle tran3s d-flex align-items-center justify-content-center"><i className="bi bi-search"></i></a>
                           </li>
                        </ul>
                     </div>

                     <nav className="navbar navbar-expand-lg p0 ms-lg-5 order-lg-2">
                        <button className="navbar-toggler d-block d-lg-none" type="button" data-bs-toggle="collapse"
                           data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false"
                           aria-label="Toggle navigation">
                           <span></span>
                        </button>
                        <div className="collapse navbar-collapse ms-xl-5" id="navbarNav">
                           <NavMenu />
                        </div>
                     </nav>
                  </div>
               </div>
            </div>
         </header>

         <LoginModal />
         <HeaderSearchbar isSearch={isSearch} setIsSearch={setIsSearch} />
      </>
   )
}

export default HeaderFour
