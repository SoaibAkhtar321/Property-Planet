import Image from "next/image"

import circleImg from "@/assets/images/icon/icon_39.svg"
import ContactForm from "@/components/forms/ContactForm";
import { CONTACT_EMAIL, CONTACT_PHONE_DISPLAY, CONTACT_PHONE_HREF, SOCIAL_LINKS } from "@/lib/site/contact";

interface DataType {
   id: number;
   class_name?: string;
   title: string;
   address_1: string;
   address_2?: string;
   /** Where address_1 should link to (mailto:, tel:, https:). */
   href_1?: string;
}

// Phase 20: real contact details from src/lib/site/contact.ts, replacing
// the template's placeholder "ask@gmail.com" / "+210 0000 0000" values.
// The phone is a tel: link so it dials on mobile. Instagram is the one
// verified social account; nothing else is invented.
const address_data: DataType[] = [
   {
      id: 1,
      title: "We're always happy to help.",
      address_1: CONTACT_EMAIL,
      href_1: `mailto:${CONTACT_EMAIL}`,
   },
   {
      id: 2,
      class_name: "skew-line",
      title: "Call us",
      address_1: CONTACT_PHONE_DISPLAY,
      href_1: CONTACT_PHONE_HREF,
   },
   ...SOCIAL_LINKS.map((social, i) => ({
      id: 3 + i,
      title: `Follow us on ${social.name}`,
      address_1: "@riality_of_hyderabad",
      href_1: social.href,
   })),
]

const ContactArea = () => {
   return (
      <div className="contact-us border-top mt-130 xl-mt-100 pt-80 lg-pt-60">
         <div className="container">
            <div className="row">
               <div className="col-xxl-9 col-xl-8 col-lg-10 m-auto">
                  <div className="title-one text-center wow fadeInUp">
                     {/* SEO fix (Section 17 — Heading Structure): this was an <h3>,
                         leaving the page with no <h1> at all. */}
                     <h1>Questions? Feel Free to Reach Out Via Message.</h1>
                  </div>
               </div>
            </div>
         </div>

         <div className="address-banner wow fadeInUp mt-60 lg-mt-40">
            <div className="container">
               <div className="d-flex flex-wrap justify-content-center justify-content-lg-between">
                  {address_data.map((item) => (
                     <div key={item.id} className={`block position-relative ${item.class_name} z-1 mt-25`}>
                        <div className="d-xl-flex align-items-center">
                           <div className="icon rounded-circle d-flex align-items-center justify-content-center">
                              <Image src={circleImg} alt="" className="lazy-img" /></div>
                           <div className="text">
                              <p className="fs-22">{item.title}</p>
                              {item.href_1 ? (
                                 <a
                                    href={item.href_1}
                                    className="tran3s"
                                    {...(item.href_1.startsWith("http")
                                       ? { target: "_blank", rel: "noopener noreferrer" }
                                       : {})}
                                 >
                                    {item.address_1}
                                 </a>
                              ) : (
                                 <span>{item.address_1}</span>
                              )}
                           </div>
                        </div>
                     </div>
                  ))}
               </div>
            </div>
         </div>

         <div className="bg-pink mt-150 xl-mt-120 md-mt-80">
            <div className="row">
               <div className="col-xl-7 col-lg-6">
                  <div className="form-style-one wow fadeInUp">
                     <ContactForm />
                  </div>
               </div>
               <div className="col-xl-5 col-lg-6 d-flex order-lg-first">
                  <div className="contact-map-banner w-100">
                     <div className="gmap_canvas h-100 w-100">
                        <iframe className="gmap_iframe h-100 w-100" src="https://maps.google.com/maps?width=600&amp;height=400&amp;hl=en&amp;q=Future City Hyderabad&amp;t=&amp;z=11&amp;ie=UTF8&amp;iwloc=B&amp;output=embed"></iframe>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </div>
   )
}

export default ContactArea
