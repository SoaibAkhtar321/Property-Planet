import FooterFour from '@/layouts/footers/FooterFour'
import HeaderOne from '@/layouts/headers/HeaderOne'
import ForgotPasswordForm from '@/components/forms/ForgotPasswordForm'

const ForgotPassword = () => {
   return (
      <>
         <HeaderOne style={true} />
         <div className="user-data-page pt-100 pb-100">
            <div className="container">
               <div className="user-data-form m-auto" style={{ maxWidth: 480 }}>
                  <div className="text-center mb-30">
                     <h2>Reset your password</h2>
                  </div>
                  <ForgotPasswordForm />
               </div>
            </div>
         </div>
         <FooterFour />
      </>
   )
}

export default ForgotPassword
