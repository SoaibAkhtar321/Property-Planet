import FooterFour from '@/layouts/footers/FooterFour'
import HeaderOne from '@/layouts/headers/HeaderOne'
import ResetPasswordForm from '@/components/forms/ResetPasswordForm'

const ResetPassword = () => {
   return (
      <>
         <HeaderOne style={true} />
         <div className="user-data-page pt-100 pb-100">
            <div className="container">
               <div className="user-data-form m-auto" style={{ maxWidth: 480 }}>
                  <div className="text-center mb-30">
                     <h2>Choose a new password</h2>
                  </div>
                  <ResetPasswordForm />
               </div>
            </div>
         </div>
         <FooterFour />
      </>
   )
}

export default ResetPassword
