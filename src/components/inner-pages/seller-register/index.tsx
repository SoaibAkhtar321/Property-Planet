import FooterFour from '@/layouts/footers/FooterFour'
import HeaderOne from '@/layouts/headers/HeaderOne'
import SellerRegisterForm from '@/components/forms/SellerRegisterForm'

const SellerRegister = () => {
   return (
      <>
         <HeaderOne style={true} />
         <div className="user-data-page pt-100 pb-100">
            <div className="container">
               <div className="user-data-form m-auto" style={{ maxWidth: 480 }}>
                  <div className="text-center mb-30">
                     <h2>Register as a Seller/Agent</h2>
                     <p className="fs-20 color-dark">List properties and manage leads on Property Planet.</p>
                  </div>
                  <SellerRegisterForm />
               </div>
            </div>
         </div>
         <FooterFour />
      </>
   )
}

export default SellerRegister
