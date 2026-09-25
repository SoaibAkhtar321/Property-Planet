"use client"
import { useEffect, useState } from "react"
import dynamic from "next/dynamic"
import "leaflet/dist/leaflet.css"

interface MarkerType {
   id: number;
   name: string;
   lat: number;
   lng: number;
   priority: number;
   demand: string;
   catalyst: string;
}

// South-East Hyderabad corridor villages, ranked per The Property Planet's
// village demand matrix (ORR / Srisailam Highway / RRR / NH-44 belts).
// Coordinates are approximate town centres and should be refined with
// surveyed plot coordinates as real inventory is onboarded.
const markers: MarkerType[] = [
   { id: 1, name: "Raviryal", lat: 17.2431, lng: 78.5486, priority: 1, demand: "Very High", catalyst: "ORR + Srisailam Highway intersection gateway" },
   { id: 2, name: "Tukkuguda", lat: 17.1928, lng: 78.5119, priority: 2, demand: "Very High", catalyst: "ORR + Srisailam Highway urban spillover" },
   { id: 3, name: "Kongara Kalan", lat: 17.1706, lng: 78.5325, priority: 3, demand: "Very High", catalyst: "Srisailam Highway + regional growth influence" },
   { id: 4, name: "Adibatla", lat: 17.2306, lng: 78.5433, priority: 4, demand: "Very High", catalyst: "Srisailam Highway + Aerospace / IT SEZ ecosystem" },
   { id: 5, name: "Kongara Khurd", lat: 17.1550, lng: 78.5450, priority: 5, demand: "High", catalyst: "Adibatla / Raviryal transitional land wedge" },
   { id: 6, name: "Nadargul", lat: 17.2836, lng: 78.5561, priority: 6, demand: "High", catalyst: "Adibatla - Balapur urban residential extension" },
   { id: 7, name: "Maheshwaram", lat: 17.0656, lng: 78.4844, priority: 7, demand: "High", catalyst: "Srisailam corridor & electronics manufacturing belt" },
   { id: 8, name: "Ibrahimpatnam", lat: 17.2333, lng: 78.6167, priority: 8, demand: "High", catalyst: "Nagarjuna Sagar Highway + educational hub + RRR" },
   { id: 9, name: "Kandukur", lat: 17.2264, lng: 78.5822, priority: 9, demand: "High", catalyst: "Srisailam Highway + RRR land-banking pocket" },
   { id: 10, name: "Mucherla", lat: 17.0153, lng: 78.5167, priority: 10, demand: "High", catalyst: "Master-plan core & southern growth axis" },
   { id: 11, name: "Amangal", lat: 16.9944, lng: 78.5628, priority: 11, demand: "High", catalyst: "NH-765 Srisailam crossing & agrarian-urban conversion" },
   { id: 12, name: "Keshampet", lat: 17.0850, lng: 78.4200, priority: 12, demand: "Medium-High", catalyst: "RRR + NH-44 western-south linkage zone" },
   { id: 13, name: "Shadnagar", lat: 17.0667, lng: 78.2000, priority: 13, demand: "High", catalyst: "NH-44 Bangalore Highway + RRR logistics hub" },
   { id: 14, name: "Mankhal", lat: 17.1922, lng: 78.6294, priority: 14, demand: "Medium-High", catalyst: "Adibatla - Ibrahimpatnam industrial connector" },
   { id: 15, name: "Thorrur", lat: 17.2100, lng: 78.5700, priority: 15, demand: "Medium-High", catalyst: "Adibatla intermediate high-potential corridor" },
]

const HYDERABAD_AIRPORT = { lat: 17.2403, lng: 78.4294, name: "Hyderabad Airport (RGIA)" };
const MAP_CENTER: [number, number] = [17.13, 78.51];

// Loaded client-side only — Leaflet touches `window` and breaks SSR otherwise.
const LeafletMap = dynamic(() => import("./PropertyPlanetLeafletMap"), {
   ssr: false,
   loading: () => (
      <div className="map-fallback d-flex align-items-center justify-content-center text-center">
         Loading map…
      </div>
   ),
});

const haversineKm = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => {
   const R = 6371;
   const dLat = (b.lat - a.lat) * Math.PI / 180;
   const dLng = (b.lng - a.lng) * Math.PI / 180;
   const lat1 = a.lat * Math.PI / 180;
   const lat2 = b.lat * Math.PI / 180;
   const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
   return Math.round(R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h)));
};

const ORR_APPROX = { lat: 17.24, lng: 78.44 };

const PropertyPlanetMapIntelligence = () => {
   const [mounted, setMounted] = useState(false);
   const [active, setActive] = useState<MarkerType>(markers[0]);

   useEffect(() => { setMounted(true) }, []);

   return (
      <div className="property-planet-map-intel pp-band pp-band--sky position-relative z-1 mt-150 xl-mt-120 md-mt-80">
         <div className="container">
            <div className="title-one text-center mb-50 lg-mb-30 wow fadeInUp">
               <h2 className="font-garamond fs-lg">Property Planet Property Intelligence</h2>
               <p className="fs-22 mt-xs">Tracking the South-East Hyderabad growth corridor — ORR, Srisailam Highway &amp; RRR.</p>
            </div>

            <div className="map-frame position-relative wow fadeInUp">
               <div className="map-canvas">
                  {!mounted ? (
                     <div className="map-fallback d-flex align-items-center justify-content-center text-center">
                        Loading map…
                     </div>
                  ) : (
                     <LeafletMap
                        center={MAP_CENTER}
                        markers={markers}
                        airport={HYDERABAD_AIRPORT}
                        activeId={active.id}
                        onSelect={(id: number) => {
                           const m = markers.find((mm) => mm.id === id);
                           if (m) setActive(m);
                        }}
                     />
                  )}
               </div>

               <div className="intel-panel">
                  <div className="intel-title fw-500">PROPERTY PLANET CORRIDOR INTEL</div>
                  <div className="intel-location fs-20 fw-500 mt-2">{active.name}</div>
                  <ul className="style-none intel-stats mt-3">
                     <li><span>Priority Rank</span><strong>#{active.priority}</strong></li>
                     <li><span>Demand Status</span><strong>{active.demand}</strong></li>
                     <li><span>Airport Distance</span><strong>{haversineKm(active, HYDERABAD_AIRPORT)} km</strong></li>
                     <li><span>ORR Distance</span><strong>{haversineKm(active, ORR_APPROX)} km</strong></li>
                  </ul>
                  <div className="intel-catalyst fs-13 mt-3">{active.catalyst}</div>
               </div>

               <div className="map-hint fs-14 opacity-65">Tap a marker to explore the corridor</div>
            </div>
         </div>

         <style jsx>{`
            .map-frame {
               position: relative;
               background: #fff;
               border: 1px solid #F5EDE8;
               border-radius: 16px;
               padding: 18px;
               box-shadow: 0 20px 50px rgba(20, 20, 10, 0.06);
            }
            .map-canvas {
               width: 100%;
               height: 420px;
               border-radius: 10px;
               overflow: hidden;
               background: #FFF8F4;
            }
            .map-fallback {
               width: 100%;
               height: 100%;
               font-size: 13px;
               color: #6b6255;
               padding: 20px;
            }
            .intel-panel {
               position: absolute;
               top: 28px;
               left: 28px;
               background: rgba(255, 255, 255, 0.92);
               backdrop-filter: blur(6px);
               border: 1px solid #F5EDE8;
               border-radius: 12px;
               padding: 18px 22px;
               width: 250px;
               box-shadow: 0 12px 30px rgba(20, 20, 10, 0.08);
               pointer-events: none;
               z-index: 500;
            }
            .intel-title {
               font-size: 11px;
               letter-spacing: 1px;
               color: #178C48;
            }
            .intel-stats li {
               display: flex;
               justify-content: space-between;
               font-size: 13px;
               padding: 4px 0;
               border-bottom: 1px dashed #eee;
            }
            .intel-stats li:last-child {
               border-bottom: none;
            }
            .intel-catalyst {
               color: #6b6255;
               line-height: 1.4;
            }
            .map-hint {
               text-align: center;
               margin-top: 14px;
            }
            @media (max-width: 767px) {
               .intel-panel {
                  position: static;
                  width: 100%;
                  margin-top: 16px;
                  pointer-events: auto;
               }
               .map-canvas {
                  height: 320px;
               }
            }

            /* Dark mode: this panel had no dark styling at all -- a solid
               white map frame with a translucent white overlay card and
               near-invisible light borders, sitting on an otherwise dark
               homepage. */
            :global([data-theme="dark"]) .map-frame {
               background: var(--pp-card-bg);
               border-color: var(--pp-border);
            }
            :global([data-theme="dark"]) .map-canvas {
               background: var(--pp-surface-2, var(--pp-input-bg));
            }
            :global([data-theme="dark"]) .map-fallback {
               color: var(--pp-text-muted);
            }
            :global([data-theme="dark"]) .intel-panel {
               background: rgba(22, 42, 48, 0.92);
               border-color: var(--pp-border);
            }
            :global([data-theme="dark"]) .intel-stats li {
               border-bottom-color: var(--pp-border);
            }
            :global([data-theme="dark"]) .intel-catalyst {
               color: var(--pp-text-muted);
            }
         `}</style>
      </div>
   )
}

export default PropertyPlanetMapIntelligence
