import FooterOne from '@/layouts/footers/FooterOne'
import HeaderTwo from '@/layouts/headers/HeaderTwo'
import SellerLoginForm from '@/components/forms/SellerLoginForm'
import Link from 'next/link'

const SellerLogin = () => {
   return (
      <>
         <HeaderTwo style_1={false} style_2={false} staticHeader={true} />
         <div className="user-data-page pt-100 pb-100">
            <div className="container">
               <div className="user-data-form m-auto" style={{ maxWidth: 480 }}>
                  <div className="pp-login-top">
                     <Link href="/" className="pp-login-back"><i className="bi bi-arrow-left" aria-hidden="true"></i> Home</Link>
                     <span />
                  </div>
                  <div className="text-center mb-30">
                     <h2>Seller/Agent Login</h2>
                     <p className="fs-18 color-dark">For sellers and agents listing property.{" "}
                        Buying instead? <button type="button" className="btn-link p-0 border-0 bg-transparent text-decoration-underline" data-bs-toggle="modal" data-bs-target="#loginModal">Buyer login</button></p>
                  </div>
                  <div className="form-wrapper m-auto">
                     <SellerLoginForm />
                  </div>
               </div>
            </div>
         </div>
         <FooterOne style={true} />
      </>
   )
}

export default SellerLogin
