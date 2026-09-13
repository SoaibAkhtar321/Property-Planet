interface DataType {
   id: number;
   page: string
   question: string;
   answer: string;
   showAnswer: boolean;
}

const faq_data:DataType[] = [
   {
      id: 1,
      page: "home_2_faq_1",
      question: "Advance Search",
      answer: "It only takes 5 minutes. Set-up is smooth & simple, with fully customisable filter to the right one.",
      showAnswer: false,
   },
   {
      id: 2,
      page: "home_2_faq_1",
      question: "Exert Agents for any help",
      answer: "It only takes 5 minutes. Set-up is smooth & simple, with fully customisable filter to the right one.",
      showAnswer: false,
   },
   {
      id: 3,
      page: "home_2_faq_1",
      question: "Protected payments, every time",
      answer: "It only takes 5 minutes. Set-up is smooth & simple, with fully customisable filter to the right one.",
      showAnswer: false,
   },

   // home_2_faq_2

   {
      id: 1,
      page: "home_2_faq_2",
      question: "What is Property Planet?",
      answer:
         "Property Planet is a real estate platform connecting buyers and sellers, with admin-verified projects and plotted developments across South Hyderabad. Every listing and project shown here goes through admin moderation before it's published.",
      showAnswer: false,
   },
   {
      id: 2,
      page: "home_2_faq_2",
      question: "What is Urban Crest?",
      answer:
         "Urban Crest is a 17-acre plotted development by Elite Infra Group, located at Kongara Khurd-A in South Hyderabad. You can view available plots, pricing, master plan, and other project details on its dedicated project page.",
      showAnswer: false,
   },
   {
      id: 3,
      page: "home_2_faq_2",
      question: "How do I enquire about a plot or a project?",
      answer:
         "Simply send an enquiry from the plot's listing page or the project's page. Your enquiry is routed to our team, who will follow up with the information and next steps you need.",
      showAnswer: false,
   },
   {
      id: 4,
      page: "home_2_faq_2",
      question: "How can I schedule a site visit?",
      answer:
         "Once you've sent an enquiry for a specific plot, you can request a site visit from your buyer dashboard. Visits are confirmed by our team, and the exact location is shared once your visit is set up.",
      showAnswer: false,
   },
   {
      id: 5,
      page: "home_2_faq_2",
      question: "Is my contact information kept private?",
      answer:
         "Yes. Seller and buyer contact details are only exchanged once a genuine enquiry has been made and confirmed, so you can browse listings and projects without your information being shared upfront.",
      showAnswer: false,
   },
   {
      id: 6,
      page: "home_2_faq_2",
      question: "How can I reach Property Planet directly?",
      answer:
         "For any questions about listings, projects, or ongoing enquiries, you can call us directly at +91 80967 86351.",
      showAnswer: false,
   },

   // home_six
   
   {
      id: 1,
      page: "home_six",
      question: "Who we are?",
      answer: "Our founders Dustin Moskovitz and Justin Rosenstein met while leading Engineering .",
      showAnswer: false,
   },
   {
      id: 2,
      page: "home_six",
      question: "What’s our goal",
      answer: "Our founders Dustin Moskovitz and Justin Rosenstein met while leading Engineering .",
      showAnswer: false,
   },
   {
      id: 3,
      page: "home_six",
      question: "Our vision",
      answer: "Our founders Dustin Moskovitz and Justin Rosenstein met while leading Engineering .",
      showAnswer: false,
   },
];

export default faq_data;