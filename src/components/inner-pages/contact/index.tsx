import FooterOne from '@/layouts/footers/FooterOne'
import HeaderTwo from '@/layouts/headers/HeaderTwo'
import ContactArea from './ContactArea'

// Same header and footer as every other public page (this page used the
// template's alternate HeaderOne/FooterFour, whose light illustration and
// different menu looked out of place, especially in dark mode).
const Contact = () => {
   return (
      <>
         <HeaderTwo style_1={false} style_2={false} />
         <ContactArea />
         <FooterOne style={true} />
      </>
   )
}

export default Contact
