import FooterFour from "@/layouts/footers/FooterFour";
import HeaderOne from "@/layouts/headers/HeaderOne";
import CompleteProfileForm from "@/components/forms/CompleteProfileForm";

const CompleteProfile = () => {
   return (
      <>
         <HeaderOne style={true} />
         <div className="user-data-page pt-100 pb-100">
            <div className="container">
               <div className="user-data-form m-auto" style={{ maxWidth: 480 }}>
                  <div className="text-center mb-30">
                     <h2>One more step</h2>
                     <p className="fs-16 color-dark mt-15">
                        Add your phone number so sellers and our team can reach you about your inquiries.
                     </p>
                  </div>
                  <CompleteProfileForm />
               </div>
            </div>
         </div>
         <FooterFour />
      </>
   );
};

export default CompleteProfile;
