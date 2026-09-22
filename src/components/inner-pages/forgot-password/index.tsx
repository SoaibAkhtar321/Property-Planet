import FooterOne from '@/layouts/footers/FooterOne'
import HeaderTwo from '@/layouts/headers/HeaderTwo'
import ForgotPasswordForm from '@/components/forms/ForgotPasswordForm'

const ForgotPassword = () => {
   return (
      <>
         <HeaderTwo style_1={false} style_2={false} staticHeader={true} />
         <div className="user-data-page pt-100 pb-100">
            <div className="container">
               <div className="user-data-form m-auto" style={{ maxWidth: 480 }}>
                  <div className="text-center mb-30">
                     <h2>Reset your password</h2>
                  </div>
                  <div className="form-wrapper m-auto">
                     <ForgotPasswordForm />
                  </div>
               </div>
            </div>
         </div>
         <FooterOne style={true} />
      </>
   )
}

export default ForgotPassword
