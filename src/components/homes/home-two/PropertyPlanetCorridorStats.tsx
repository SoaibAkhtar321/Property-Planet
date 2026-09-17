"use client"

// Replaces the old template's "Join 27,000+ companies" SaaS-logo banner
// (Slack/Google/Shopify/etc.) — irrelevant to a land & plots agency and
// read as a fabricated trust claim. This strip surfaces real, verifiable
// figures from The Property Planet's own South-East Hyderabad corridor
// intelligence instead of borrowed/fake social proof.

interface StatType {
   value: string;
   label: string;
}

const stats: StatType[] = [
   { value: "15", label: "Villages Tracked" },
   { value: "3", label: "Growth Corridors" },
   { value: "4", label: "Very-High-Demand Nodes" },
   { value: "ORR · Srisailam · RRR", label: "Corridor Coverage" },
]

const PropertyPlanetCorridorStats = () => {
   return (
      <div className="corridor-stats-strip position-relative z-2">
         <div className="container">
            <p className="text-white fs-24 text-center mb-40 lg-mb-20">
               Backed by <span>on-ground corridor intelligence</span>, not guesswork.
            </p>
            <div className="row justify-content-center gy-4">
               {stats.map((s, i) => (
                  <div key={i} className="col-6 col-md-3 text-center">
                     <div className="stat-value">{s.value}</div>
                     <div className="stat-label">{s.label}</div>
                  </div>
               ))}
            </div>
         </div>

         <style jsx>{`
            .corridor-stats-strip {
               padding: 50px 0 60px;
            }
            .corridor-stats-strip :global(span) {
               color: #FF6725;
            }
            .stat-value {
               font-family: var(--title-font, serif);
               font-size: 34px;
               font-weight: 500;
               color: #FF6725;
               line-height: 1.2;
            }
            .stat-label {
               font-size: 14px;
               color: rgba(255, 255, 255, 0.75);
               margin-top: 6px;
               letter-spacing: 0.3px;
            }
            @media (max-width: 767px) {
               .stat-value {
                  font-size: 26px;
               }
            }
         `}</style>
      </div>
   )
}

export default PropertyPlanetCorridorStats
