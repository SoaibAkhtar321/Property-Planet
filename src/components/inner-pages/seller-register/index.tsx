import FooterOne from '@/layouts/footers/FooterOne'
import HeaderTwo from '@/layouts/headers/HeaderTwo'
import SellerRegisterForm from '@/components/forms/SellerRegisterForm'

const SellerRegister = () => {
   return (
      <>
         <HeaderTwo style_1={false} style_2={false} />
         <div className="user-data-page pt-100 pb-100">
            <div className="container">
               <div className="user-data-form m-auto" style={{ maxWidth: 480 }}>
                  <div className="text-center mb-30">
                     <h2>Register as a Seller/Agent</h2>
                     <p className="fs-20 color-dark">List properties and manage leads on Property Planet.</p>
                  </div>
                  <div className="form-wrapper m-auto">
                     <SellerRegisterForm />
                  </div>
               </div>
            </div>
         </div>
         <FooterOne style={true} />
      </>
   )
}

export default SellerRegister
