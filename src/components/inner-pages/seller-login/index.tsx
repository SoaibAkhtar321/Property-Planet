import FooterOne from '@/layouts/footers/FooterOne'
import HeaderTwo from '@/layouts/headers/HeaderTwo'
import SellerLoginForm from '@/components/forms/SellerLoginForm'

const SellerLogin = () => {
   return (
      <>
         <HeaderTwo style_1={false} style_2={false} staticHeader={true} />
         <div className="user-data-page pt-100 pb-100">
            <div className="container">
               <div className="user-data-form m-auto" style={{ maxWidth: 480 }}>
                  <div className="text-center mb-30">
                     <h2>Seller/Agent Login</h2>
                     <p className="fs-20 color-dark">Buyer? Use the Login button in the header instead.</p>
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
