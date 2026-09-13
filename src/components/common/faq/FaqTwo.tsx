"use client"
import faq_data from '@/data/home-data/FaqData';

const FaqTwo = () => {

   const items = faq_data.filter((item) => item.page === "home_2_faq_2");

   return (
      <>
         {items.map((item, index) => (
            <div key={item.id} className="accordion-item">
               <h2 className="accordion-header">
                  <button className={`accordion-button ${index === 0 ? "" : "collapsed"}`} type="button"
                     data-bs-toggle="collapse" data-bs-target={`#collapse${item.id}`} aria-expanded="true"
                     aria-controls={`collapse${item.id}`}>
                     {item.question}
                  </button>
               </h2>
               <div id={`collapse${item.id}`} className={`accordion-collapse collapse ${index === 0 ? "show" : ""}`}
                  data-bs-parent="#accordionTwo">
                  <div className="accordion-body">
                     <p>{item.answer}</p>
                  </div>
               </div>
            </div>
         ))}
      </>
   )
}

export default FaqTwo
