/**
 * Plain-language explanation of how buyer enquiries are handled, shown on
 * the seller/agent registration page BEFORE the form so it is read before
 * the terms checkbox is ticked. Deliberately makes no promise of sales,
 * payments, commission or any transaction outcome -- commercial
 * arrangements follow the agreed business terms.
 */
const STEPS: string[] = [
   "You list your property on Property Planet.",
   "Buyers browse listings and can submit an enquiry.",
   "When a buyer enquires, the enquiry is received by the Property Planet team.",
   "You can see that a lead has arrived, along with the buyer's name and the enquiry details, in your dashboard.",
   "The buyer's private contact details (phone and email) are handled by the Property Planet team and are not shared directly with sellers.",
   "Our team may coordinate with you and the buyer regarding the enquiry and next steps.",
   "Any commercial arrangement, commission or payment between the relevant parties is handled according to the agreed business terms.",
];

const HowLeadsWork = () => {
   return (
      <div className="mb-40" style={{ border: "1px solid var(--pp-border)", borderRadius: 16, padding: "24px 26px", background: "var(--pp-surface-2)" }}>
         <h5 className="mb-15">How leads work on Property Planet</h5>
         <p className="fs-16 mb-15">
            Property Planet manages the initial lead coordination. Buyer contact details are handled by the
            Property Planet team and are not directly shared with sellers. Our team may coordinate with the
            relevant seller/agent and buyer regarding the enquiry and next steps.
         </p>
         <ol className="fs-16 mb-0" style={{ paddingLeft: 22 }}>
            {STEPS.map((step) => (
               <li key={step} className="mb-5">
                  {step}
               </li>
            ))}
         </ol>
      </div>
   );
};

export default HowLeadsWork;
