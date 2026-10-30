// /faq content. Property Planet only sells — plots, land, villas, homes and
// project units. There is no renting, leasing or PG on this site, so there
// is deliberately no rental section here.
interface DataType {
   id: number;
   id_name: string;
   title: string;
   md_pt?: boolean;
   faq: {
      id: number;
      question: string;
      answer: string;
      showAnswer?: boolean;
   }[];
}

const inner_faq_data: DataType[] = [
   {
      id: 1,
      id_name: "Buying",
      title: "BUYING",
      md_pt: true,
      faq: [
         {
            id: 1,
            question: "What kind of property can I buy on Property Planet?",
            answer: "Property Planet lists properties for sale only — open plots, agricultural and farm land, villas, independent houses, apartments and units inside larger projects, mainly across the south Hyderabad growth corridor.",
         },
         {
            id: 2,
            question: "How do I enquire about a property?",
            answer: "Open the property or project and tap “Send Inquiry”. Share your name and mobile number (and a preferred date or time if you like). The Property Planet team calls you back on that number. You can track your enquiries from your dashboard after signing in.",
         },
         {
            id: 3,
            question: "Are listings verified?",
            answer: "Every listing is reviewed by our team before it goes live. That review is not a legal title check, so always verify ownership, approvals (HMDA/DTCP/RERA where applicable) and documents yourself or with a lawyer before paying anything.",
         },
         {
            id: 4,
            question: "Can I save properties to look at later?",
            answer: "Yes. Sign in and tap the heart on any listing. Your saved properties appear under Favourites in your dashboard.",
         },
      ],
   },
   {
      id: 2,
      id_name: "Selling",
      title: "SELLING",
      faq: [
         {
            id: 5,
            question: "How do I list my property for sale?",
            answer: "Choose “Become a Seller”, create your account, then add your property with its price, area, location and photos and submit it for review. Listing is free.",
         },
         {
            id: 6,
            question: "How long does the review take, and what if my listing is rejected?",
            answer: "Our team reviews submissions as quickly as possible. If a listing is rejected you will see the reason on the listing; you can revise it and submit it again.",
         },
         {
            id: 7,
            question: "Will buyers see my phone number or exact address?",
            answer: "No. Enquiries come to the Property Planet team first, and the public map shows only an approximate location. The exact address is shared with a buyer only after a site visit is confirmed.",
         },
      ],
   },
   {
      id: 3,
      id_name: "Projects",
      title: "PROJECTS",
      faq: [
         {
            id: 8,
            question: "What is the difference between a project and an individual property?",
            answer: "A project is a larger development (for example a plotted layout or a gated community) with its own pricing, location and list of available units. Individual properties are single listings from owners or our team and appear under Properties.",
         },
         {
            id: 9,
            question: "How do I enquire about a specific unit in a project?",
            answer: "Open the project, look through its available units and tap “Send Inquiry” on the one you like, or enquire about the whole project from the project page.",
         },
      ],
   },
   {
      id: 4,
      id_name: "Visits",
      title: "SITE VISITS & LOCATION",
      faq: [
         {
            id: 10,
            question: "How do I book a site visit?",
            answer: "After you have sent an enquiry on a property, open it again while signed in and request a site visit with your preferred date and time. Our team confirms the visit with you.",
         },
         {
            id: 11,
            question: "When can I see the exact location?",
            answer: "Once your site visit has been confirmed, the exact address and map pin become available to you on that property's page.",
         },
      ],
   },
   {
      id: 5,
      id_name: "Payments",
      title: "PAYMENTS",
      faq: [
         {
            id: 12,
            question: "Do I pay anything through the website?",
            answer: "No. Property Planet does not collect token amounts, booking fees or any payment online. Never transfer money based only on a message or a listing — confirm the property and the seller's documents in person first.",
         },
         {
            id: 13,
            question: "Is listing or enquiring free?",
            answer: "Yes. Creating an account, listing a property for sale and sending enquiries are all free.",
         },
      ],
   },
   {
      id: 6,
      id_name: "Account",
      title: "ACCOUNT",
      faq: [
         {
            id: 14,
            question: "How do I change my phone number or password?",
            answer: "Sign in and open Profile to update your details, or Account Settings to change your password.",
         },
         {
            id: 15,
            question: "Can I delete my account?",
            answer: "Yes. Go to Profile in your dashboard and use the Delete Account option. Your personal data is removed.",
         },
      ],
   },
];

export default inner_faq_data;
