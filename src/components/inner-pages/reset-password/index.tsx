import FooterOne from '@/layouts/footers/FooterOne'
import HeaderTwo from '@/layouts/headers/HeaderTwo'
import ResetPasswordForm from '@/components/forms/ResetPasswordForm'

const ResetPassword = () => {
   return (
      <>
         <HeaderTwo style_1={false} style_2={false} staticHeader={true} />
         <div className="user-data-page pt-100 pb-100">
            <div className="container">
               <div className="user-data-form m-auto" style={{ maxWidth: 480 }}>
                  <div className="text-center mb-30">
                     <h2>Choose a new password</h2>
                  </div>
                  <div className="form-wrapper m-auto">
                     <ResetPasswordForm />
                  </div>
               </div>
            </div>
         </div>
         <FooterOne style={true} />
      </>
   )
}

export default ResetPassword
