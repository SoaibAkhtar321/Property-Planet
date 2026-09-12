import FooterFour from '@/layouts/footers/FooterFour'
import HeaderOne from '@/layouts/headers/HeaderOne'
import SellerLoginForm from '@/components/forms/SellerLoginForm'

const SellerLogin = () => {
   return (
      <>
         <HeaderOne style={true} />
         <div className="user-data-page pt-100 pb-100">
            <div className="container">
               <div className="user-data-form m-auto" style={{ maxWidth: 480 }}>
                  <div className="text-center mb-30">
                     <h2>Seller/Agent Login</h2>
                     <p className="fs-20 color-dark">Buyer? Use the Login button in the header instead.</p>
                  </div>
                  <SellerLoginForm />
               </div>
            </div>
         </div>
         <FooterFour />
      </>
   )
}

export default SellerLogin
