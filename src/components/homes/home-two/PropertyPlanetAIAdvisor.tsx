"use client"
import { useState } from "react"

interface RecoCard {
   title: string;
   price: string;
   area: string;
   match: string;
}

interface ChatMessage {
   role: "user" | "ai";
   text: string;
   recos?: RecoCard[];
}

const suggestedQuestions = [
   "Find plots under ₹1 crore",
   "Show land near Adibatla",
   "I need 5 acres for a business",
   "Show villas near Shamshabad",
   "Which areas are part of the growth corridor?",
   "I want an apartment",
   "I want to sell my land",
]

const mockResponse = (question: string): ChatMessage => {
   const q = question.toLowerCase();

   if (q.includes("sell")) {
      return {
         role: "ai",
         text: "You can submit your land or property through our Sell Property page. Our team reviews every submission before it's presented to relevant buyers, developers or companies.",
      };
   }
   if (q.includes("5 acres") || q.includes("business") || (q.includes("acre"))) {
      return {
         role: "ai",
         text: "Based on your requirement, larger land opportunities around Mucherla, Kandukur and Adibatla may be relevant.",
         recos: [
            { title: "Mucherla Growth Land", price: "₹4.1 Cr", area: "6 acres", match: "89% Match" },
            { title: "Kandukur Industrial Parcel", price: "₹6.8 Cr", area: "9 acres", match: "84% Match" },
         ],
      };
   }
   if (q.includes("villa")) {
      return {
         role: "ai",
         text: "I found prototype villa opportunities in the Shamshabad growth corridor.",
         recos: [
            { title: "Gated Villa, Shamshabad Corridor", price: "₹1.8 Cr", area: "3,200 sq.ft", match: "90% Match" },
         ],
      };
   }
   if (q.includes("apartment")) {
      return {
         role: "ai",
         text: "Here are prototype apartment opportunities close to the South-East growth belt.",
         recos: [
            { title: "Skyline Residences, Tukkuguda", price: "₹68 Lakh", area: "1,450 sq.ft", match: "87% Match" },
         ],
      };
   }
   if (q.includes("corridor")) {
      return {
         role: "ai",
         text: "The South-East Hyderabad growth corridor spans Raviryal, Tukkuguda, Kongara Kalan, Adibatla, Maheshwaram, Ibrahimpatnam, Kandukur, Mucherla, Amangal and Shadnagar, along the ORR, Srisailam Highway and RRR.",
      };
   }
   // default: plots under 1 crore
   return {
      role: "ai",
      text: "I found 4 prototype opportunities that match your requirements.",
      recos: [
         { title: "Mucherla Growth Plot", price: "₹92 Lakh", area: "1,800 sq.yd", match: "92% Match" },
         { title: "Raviryal Premium Plot", price: "₹98 Lakh", area: "1,800 sq.yd", match: "88% Match" },
      ],
   };
}

const PropertyPlanetAIAdvisor = () => {
   const [messages, setMessages] = useState<ChatMessage[]>([
      { role: "ai", text: "Hi, I'm Property Planet AI. Tell me what you're looking for — a plot, land, villa, apartment or commercial opportunity — and I'll suggest verified matches." },
   ]);
   const [input, setInput] = useState("");
   const [typing, setTyping] = useState(false);

   const send = (question: string) => {
      if (!question.trim() || typing) return;
      setMessages((prev) => [...prev, { role: "user", text: question }]);
      setInput("");
      setTyping(true);
      setTimeout(() => {
         setMessages((prev) => [...prev, mockResponse(question)]);
         setTyping(false);
      }, 900);
   }

   return (
      <div className="property-planet-ai-advisor position-relative z-1 mt-150 xl-mt-120 md-mt-80">
         <div className="container">
            <div className="row align-items-center">
               <div className="col-lg-5 wow fadeInLeft">
                  <div className="title-one mb-25">
                     <h2 className="font-garamond">Ask Property Planet AI</h2>
                     <p className="fs-22 mt-xs">A prototype AI property advisor. Describe what you need and get matched, verified opportunities — reviewed by our human advisory team.</p>
                  </div>
                  <ul className="style-none faq-chips d-flex flex-wrap">
                     {suggestedQuestions.map((q, i) => (
                        <li key={i}><button type="button" onClick={() => send(q)}>{q}</button></li>
                     ))}
                  </ul>
               </div>

               <div className="col-lg-7 wow fadeInRight">
                  <div className="ai-chat-window">
                     <div className="ai-chat-header d-flex align-items-center">
                        <i className="fa-regular fa-sparkles me-2"></i>
                        <span className="fw-500">Property Planet AI</span>
                        <span className="prototype-badge ms-auto">Prototype</span>
                     </div>

                     <div className="ai-chat-body">
                        {messages.map((m, i) => (
                           <div key={i} className={`chat-bubble-row ${m.role}`}>
                              <div className="chat-bubble">
                                 {m.text}
                              </div>
                              {m.recos && (
                                 <div className="reco-cards">
                                    {m.recos.map((r, j) => (
                                       <div key={j} className="reco-card">
                                          <div className="reco-title">{r.title}</div>
                                          <div className="reco-meta">{r.price} · {r.area}</div>
                                          <span className="reco-match">{r.match}</span>
                                          <span className="reco-verified">✓ Verified</span>
                                       </div>
                                    ))}
                                 </div>
                              )}
                           </div>
                        ))}
                        {typing && (
                           <div className="chat-bubble-row ai">
                              <div className="chat-bubble typing">
                                 <span></span><span></span><span></span>
                              </div>
                           </div>
                        )}
                     </div>

                     <form
                        className="ai-chat-input d-flex align-items-center"
                        onSubmit={(e) => { e.preventDefault(); send(input); }}
                     >
                        <input
                           type="text"
                           placeholder="e.g. I want a plot near Adibatla under ₹1 crore"
                           value={input}
                           onChange={(e) => setInput(e.target.value)}
                        />
                        <button type="submit" aria-label="Send"><i className="bi bi-arrow-up-right"></i></button>
                     </form>
                  </div>
               </div>
            </div>
         </div>

         <style jsx>{`
            .faq-chips li { margin: 0 8px 10px 0; }
            .faq-chips button {
               border: 1px solid #F5EDE8;
               background: #fff;
               border-radius: 30px;
               padding: 8px 16px;
               font-size: 13px;
               color: #444;
               cursor: pointer;
               transition: all 0.2s ease;
            }
            .faq-chips button:hover {
               background: #FFF8F4;
               border-color: #FF6725;
            }
            .ai-chat-window {
               border: 1px solid #F5EDE8;
               border-radius: 16px;
               background: #fff;
               box-shadow: 0 20px 50px rgba(20, 20, 10, 0.07);
               display: flex;
               flex-direction: column;
               height: 480px;
               overflow: hidden;
            }
            .ai-chat-header {
               padding: 16px 20px;
               border-bottom: 1px solid #F5EDE8;
               font-size: 15px;
            }
            .prototype-badge {
               font-size: 11px;
               background: #FFF8F4;
               color: #FF3F25;
               padding: 3px 10px;
               border-radius: 20px;
            }
            .ai-chat-body {
               flex: 1;
               overflow-y: auto;
               padding: 18px 20px;
            }
            .chat-bubble-row {
               display: flex;
               flex-direction: column;
               margin-bottom: 14px;
            }
            .chat-bubble-row.user {
               align-items: flex-end;
            }
            .chat-bubble-row.ai {
               align-items: flex-start;
            }
            .chat-bubble {
               max-width: 82%;
               padding: 10px 16px;
               border-radius: 14px;
               font-size: 14px;
               line-height: 1.5;
            }
            .chat-bubble-row.user .chat-bubble {
               background: #201f1a;
               color: #fff;
               border-bottom-right-radius: 4px;
            }
            .chat-bubble-row.ai .chat-bubble {
               background: #FFF8F4;
               color: #2a2a24;
               border-bottom-left-radius: 4px;
            }
            .chat-bubble.typing span {
               display: inline-block;
               width: 6px;
               height: 6px;
               margin-right: 3px;
               background: #8a8a7e;
               border-radius: 50%;
               animation: blink 1.2s infinite;
            }
            .chat-bubble.typing span:nth-child(2) { animation-delay: 0.2s; }
            .chat-bubble.typing span:nth-child(3) { animation-delay: 0.4s; }
            @keyframes blink { 0%, 80%, 100% { opacity: 0.2; } 40% { opacity: 1; } }
            .reco-cards {
               margin-top: 8px;
               display: flex;
               flex-direction: column;
               gap: 8px;
               width: 100%;
               max-width: 82%;
            }
            .reco-card {
               border: 1px solid #F5EDE8;
               border-radius: 10px;
               padding: 10px 14px;
               position: relative;
               background: #fff;
            }
            .reco-title { font-size: 14px; font-weight: 500; }
            .reco-meta { font-size: 12px; opacity: 0.7; margin-top: 2px; }
            .reco-match {
               position: absolute;
               top: 10px;
               right: 12px;
               font-size: 11px;
               background: #e9f9f2;
               color: #00B579;
               padding: 2px 8px;
               border-radius: 20px;
            }
            .reco-verified {
               display: inline-block;
               margin-top: 6px;
               font-size: 11px;
               color: #00b579;
               font-weight: 500;
            }
            .ai-chat-input {
               border-top: 1px solid #F5EDE8;
               padding: 12px 14px;
            }
            .ai-chat-input input {
               flex: 1;
               border: none;
               outline: none;
               font-size: 14px;
               padding: 8px 10px;
            }
            .ai-chat-input button {
               border: none;
               background: #201f1a;
               color: #fff;
               width: 38px;
               height: 38px;
               border-radius: 50%;
               flex-shrink: 0;
               cursor: pointer;
            }
         `}</style>
      </div>
   )
}

export default PropertyPlanetAIAdvisor
