"use client"
import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { generateAIResponse, formatINR, type PropertyPlanetProperty } from "@/utils/propertyPlanetAIEngine"
import { onPropertyPlanetAIOpen } from "@/utils/propertyPlanetAIBus"

interface ChatMessage {
   role: "user" | "ai";
   text: string;
   properties?: PropertyPlanetProperty[];
}

const WELCOME_MESSAGE: ChatMessage = {
   role: "ai",
   text: "Hi \uD83D\uDC4B I'm Property Planet AI. I can help you discover verified plots, compare locations and find opportunities based on your budget.",
};

const SUGGESTED_PROMPTS = [
   "Find plots in Future City",
   "Best investment areas",
   "Properties under ₹50L",
   "Show verified plots",
];

const typeIcon = (type?: string): string => {
   switch (type) {
      case "Plot":
      case "Land":
      case "Corporate Land":
         return "fa-map-location-dot";
      case "Villa":
         return "fa-house-chimney";
      case "Apartment":
         return "fa-building";
      case "Commercial":
         return "fa-shop";
      default:
         return "fa-location-dot";
   }
};

const PropertyPlanetAIWidget = () => {
   const [open, setOpen] = useState(false);
   const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
   const [input, setInput] = useState("");
   const [typing, setTyping] = useState(false);
   const bodyRef = useRef<HTMLDivElement>(null);

   // Let the header CTA / hero link / anything else open this widget.
   useEffect(() => {
      return onPropertyPlanetAIOpen((prefill) => {
         setOpen(true);
         if (prefill) {
            // slight delay so the panel is mounted/visible before we "type"
            setTimeout(() => send(prefill), 300);
         }
      });
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, []);

   useEffect(() => {
      if (bodyRef.current) {
         bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
      }
   }, [messages, typing, open]);

   const send = (question: string) => {
      const trimmed = question.trim();
      if (!trimmed || typing) return;
      setMessages((prev) => [...prev, { role: "user", text: trimmed }]);
      setInput("");
      setTyping(true);
      // Simulated "thinking" delay — this is the seam where a real LLM/API
      // call will eventually replace generateAIResponse().
      setTimeout(() => {
         const response = generateAIResponse(trimmed);
         setMessages((prev) => [...prev, { role: "ai", text: response.text, properties: response.properties }]);
         setTyping(false);
      }, 700 + Math.random() * 400);
   };

   return (
      <>
         <button
            type="button"
            aria-label={open ? "Close Property Planet AI assistant" : "Open Property Planet AI assistant"}
            className={`property-planet-ai-fab d-flex align-items-center justify-content-center ${open ? "is-open" : ""}`}
            onClick={() => setOpen((v) => !v)}
         >
            <i className={`fa-regular ${open ? "fa-xmark" : "fa-sparkles"}`}></i>
         </button>

         <div className={`property-planet-ai-panel ${open ? "is-open" : ""}`}>
            <div className="property-planet-ai-panel-header d-flex align-items-center">
               <span className="property-planet-ai-avatar d-flex align-items-center justify-content-center">
                  <i className="fa-regular fa-sparkles"></i>
               </span>
               <div className="ms-2">
                  <div className="fw-500">Property Planet AI Advisor</div>
                  <div className="property-planet-ai-subtitle">Property intelligence, on demand</div>
               </div>
               <button type="button" aria-label="Close" className="property-planet-ai-close ms-auto" onClick={() => setOpen(false)}>
                  <i className="fa-regular fa-xmark"></i>
               </button>
            </div>

            <div className="property-planet-ai-body" ref={bodyRef}>
               {messages.map((m, i) => (
                  <div key={i} className={`property-planet-ai-row ${m.role}`}>
                     <div className="property-planet-ai-bubble">{m.text}</div>
                     {m.properties && m.properties.length > 0 && (
                        <div className="property-planet-ai-cards">
                           {m.properties.map((p) => (
                              <div key={p.id} className="property-planet-ai-card">
                                 <div className="d-flex align-items-start">
                                    <span className="property-planet-ai-card-icon d-flex align-items-center justify-content-center">
                                       <i className={`fa-regular ${typeIcon(p.property_type)}`}></i>
                                    </span>
                                    <div className="ms-2 flex-grow-1">
                                       <div className="property-planet-ai-card-title">{p.title}</div>
                                       <div className="property-planet-ai-card-meta">{p.address}</div>
                                    </div>
                                 </div>
                                 <div className="property-planet-ai-card-tags">
                                    {p.property_type && <span className="tag-type">{p.property_type}</span>}
                                    {p.verification_status && (
                                       <span className={`tag-verify ${p.verification_status === "Verified" ? "is-verified" : ""}`}>
                                          {p.verification_status === "Verified" ? "\u2713 " : ""}{p.verification_status}
                                       </span>
                                    )}
                                    {typeof p.trust_score === "number" && <span className="tag-trust">Trust {p.trust_score}</span>}
                                 </div>
                                 <div className="d-flex align-items-center justify-content-between mt-2">
                                    <strong className="property-planet-ai-card-price">{formatINR(p.price)}</strong>
                                 </div>
                              </div>
                           ))}
                        </div>
                     )}
                  </div>
               ))}

               {typing && (
                  <div className="property-planet-ai-row ai">
                     <div className="property-planet-ai-bubble property-planet-ai-typing">
                        <span></span><span></span><span></span>
                     </div>
                  </div>
               )}

               {messages.length === 1 && !typing && (
                  <ul className="style-none property-planet-ai-chips d-flex flex-wrap">
                     {SUGGESTED_PROMPTS.map((q, i) => (
                        <li key={i}><button type="button" onClick={() => send(q)}>{q}</button></li>
                     ))}
                  </ul>
               )}
            </div>

            <form
               className="property-planet-ai-input d-flex align-items-center"
               onSubmit={(e) => { e.preventDefault(); send(input); }}
            >
               <input
                  type="text"
                  placeholder="Ask about a location, budget or property..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
               />
               <button type="submit" aria-label="Send">
                  <i className="bi bi-arrow-up-right"></i>
               </button>
            </form>
            <div className="property-planet-ai-footer-note">
               Prefer a human advisor? <Link href="/contact">Contact our team.</Link>
            </div>
         </div>

         <style jsx>{`
            .property-planet-ai-fab {
               position: fixed;
               right: 24px;
               bottom: 24px;
               width: 58px;
               height: 58px;
               border-radius: 50%;
               border: none;
               background: #1c1c1c;
               color: #f3ecd8;
               font-size: 20px;
               box-shadow: 0 12px 30px rgba(20, 20, 10, 0.28);
               z-index: 1050;
               cursor: pointer;
               transition: transform 0.25s ease, background 0.25s ease;
            }
            .property-planet-ai-fab:hover { transform: translateY(-2px); background: #FF6725; color: #fff; }
            .property-planet-ai-fab.is-open { background: #FF6725; color: #fff; }

            .property-planet-ai-panel {
               position: fixed;
               right: 24px;
               bottom: 96px;
               width: 380px;
               max-width: calc(100vw - 32px);
               height: 560px;
               max-height: calc(100vh - 140px);
               background: #fff;
               border-radius: 18px;
               border: 1px solid #F5EDE8;
               box-shadow: 0 24px 60px rgba(20, 20, 10, 0.22);
               display: flex;
               flex-direction: column;
               overflow: hidden;
               z-index: 1049;
               opacity: 0;
               transform: translateY(16px) scale(0.98);
               pointer-events: none;
               transition: opacity 0.22s ease, transform 0.22s ease;
            }
            .property-planet-ai-panel.is-open {
               opacity: 1;
               transform: translateY(0) scale(1);
               pointer-events: auto;
            }

            .property-planet-ai-panel-header {
               padding: 16px 16px;
               border-bottom: 1px solid #F5EDE8;
               background: #faf9f3;
            }
            .property-planet-ai-avatar {
               width: 34px;
               height: 34px;
               border-radius: 50%;
               background: #1c1c1c;
               color: #FF6725;
               flex: 0 0 auto;
            }
            .property-planet-ai-subtitle { font-size: 12px; opacity: 0.65; }
            .property-planet-ai-close {
               border: none;
               background: transparent;
               font-size: 16px;
               opacity: 0.6;
               cursor: pointer;
            }
            .property-planet-ai-close:hover { opacity: 1; }

            .property-planet-ai-body {
               flex: 1 1 auto;
               overflow-y: auto;
               padding: 16px;
               background: #fff;
            }

            .property-planet-ai-row { margin-bottom: 14px; display: flex; flex-direction: column; }
            .property-planet-ai-row.user { align-items: flex-end; }
            .property-planet-ai-row.ai { align-items: flex-start; }

            .property-planet-ai-bubble {
               max-width: 88%;
               padding: 10px 14px;
               border-radius: 14px;
               font-size: 14px;
               line-height: 1.5;
            }
            .property-planet-ai-row.ai .property-planet-ai-bubble { background: #FFF8F4; color: #262620; border-bottom-left-radius: 4px; }
            .property-planet-ai-row.user .property-planet-ai-bubble { background: #1c1c1c; color: #fff; border-bottom-right-radius: 4px; }

            .property-planet-ai-typing { display: flex; gap: 4px; align-items: center; }
            .property-planet-ai-typing span {
               width: 6px; height: 6px; border-radius: 50%;
               background: #999; display: inline-block;
               animation: property-planet-blink 1.2s infinite ease-in-out;
            }
            .property-planet-ai-typing span:nth-child(2) { animation-delay: 0.2s; }
            .property-planet-ai-typing span:nth-child(3) { animation-delay: 0.4s; }
            @keyframes property-planet-blink { 0%, 80%, 100% { opacity: 0.25; } 40% { opacity: 1; } }

            .property-planet-ai-chips { margin-top: 8px; }
            .property-planet-ai-chips li { margin: 0 8px 8px 0; }
            .property-planet-ai-chips button {
               border: 1px solid #F5EDE8;
               background: #fff;
               border-radius: 30px;
               padding: 7px 14px;
               font-size: 12.5px;
               color: #444;
               cursor: pointer;
               transition: all 0.2s ease;
            }
            .property-planet-ai-chips button:hover { background: #FFF8F4; border-color: #FF6725; }

            .property-planet-ai-cards { margin-top: 8px; width: 100%; display: flex; flex-direction: column; gap: 8px; }
            .property-planet-ai-card {
               border: 1px solid #F5EDE8;
               border-radius: 12px;
               padding: 12px;
               background: #fff;
               width: 100%;
            }
            .property-planet-ai-card-icon {
               width: 30px; height: 30px; border-radius: 8px;
               background: #eef0e6; color: #6b7d52; flex: 0 0 auto; font-size: 13px;
            }
            .property-planet-ai-card-title { font-size: 13.5px; font-weight: 500; color: #1c1c1c; }
            .property-planet-ai-card-meta { font-size: 12px; opacity: 0.65; }
            .property-planet-ai-card-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
            .property-planet-ai-card-tags span {
               font-size: 11px; padding: 3px 8px; border-radius: 20px;
               background: #FFF8F4; color: #555;
            }
            .tag-verify.is-verified { background: rgba(0,181,121,0.12); color: #00B579; }
            .property-planet-ai-card-price { font-size: 14px; color: #1c1c1c; }
            .property-planet-ai-card-cta {
               font-size: 12px; font-weight: 500; color: #FF6725;
               text-decoration: underline;
            }

            .property-planet-ai-input {
               border-top: 1px solid #F5EDE8;
               padding: 10px 12px;
               background: #fff;
            }
            .property-planet-ai-input input {
               flex: 1 1 auto;
               border: none;
               outline: none;
               font-size: 13.5px;
               padding: 8px 6px;
               background: transparent;
            }
            .property-planet-ai-input button {
               border: none;
               background: #1c1c1c;
               color: #fff;
               width: 34px;
               height: 34px;
               border-radius: 50%;
               flex: 0 0 auto;
               cursor: pointer;
            }
            .property-planet-ai-input button:hover { background: #FF6725; color: #fff; }

            .property-planet-ai-footer-note {
               font-size: 11px;
               text-align: center;
               opacity: 0.6;
               padding: 6px 0 12px;
            }
            .property-planet-ai-footer-note :global(a) { color: #FF6725; text-decoration: underline; }

            @media (max-width: 575px) {
               .property-planet-ai-panel {
                  right: 12px;
                  left: 12px;
                  bottom: 88px;
                  width: auto;
                  max-width: none;
                  height: calc(100vh - 120px);
               }
               .property-planet-ai-fab { right: 16px; bottom: 16px; }
            }
         `}</style>
      </>
   )
}

export default PropertyPlanetAIWidget
