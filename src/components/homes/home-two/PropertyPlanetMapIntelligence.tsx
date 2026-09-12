"use client"
import { useMemo, useState } from "react"
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api"

interface MarkerType {
   id: number;
   name: string;
   lat: number;
   lng: number;
   highlight?: boolean;
}

// Approximate real-world coordinates for the Future City / southern
// Hyderabad growth corridor (Rangareddy district, NH-44 / ORR belt).
// Verified against public map data where available (Mucherla, Adibatla);
// remaining points are placed at each town's known approximate centre and
// should be refined with surveyed plot coordinates as real inventory is
// onboarded.
const markers: MarkerType[] = [
   { id: 1, name: "Future City", lat: 17.1950, lng: 78.5600, highlight: true },
   { id: 2, name: "Mucherla", lat: 17.0153, lng: 78.5167 },
   { id: 3, name: "Maheshwaram", lat: 17.0656, lng: 78.4844 },
   { id: 4, name: "Kandukur", lat: 17.2264, lng: 78.5822 },
   { id: 5, name: "Kadthal", lat: 17.0219, lng: 78.5719 },
   { id: 6, name: "Yacharam", lat: 17.0961, lng: 78.5967 },
   { id: 7, name: "Tukkuguda", lat: 17.1928, lng: 78.5119 },
   { id: 8, name: "Adibatla", lat: 17.2306, lng: 78.5433 },
   { id: 9, name: "Bongloor", lat: 17.1719, lng: 78.6167 },
   { id: 10, name: "Ibrahimpatnam", lat: 17.2333, lng: 78.6167 },
   { id: 11, name: "Shamshabad", lat: 17.2277, lng: 78.4108 },
   { id: 12, name: "Kothur", lat: 17.1167, lng: 78.2667 },
   { id: 13, name: "Shadnagar", lat: 17.0667, lng: 78.2000 },
   { id: 14, name: "Farooqnagar", lat: 17.1167, lng: 78.2833 },
]

const HYDERABAD_AIRPORT = { lat: 17.2403, lng: 78.4294, name: "Hyderabad Airport" };

const MAP_CONTAINER_STYLE = { width: "100%", height: "100%" };

// Muted cream map styling so the live map matches the site's
// existing Property Planet orange/cream palette instead of Google's default blue/grey.
const MAP_STYLES: google.maps.MapTypeStyle[] = [
   { elementType: "geometry", stylers: [{ color: "#FFF8F4" }] },
   { elementType: "labels.text.fill", stylers: [{ color: "#6b6255" }] },
   { elementType: "labels.text.stroke", stylers: [{ color: "#FFF8F4" }] },
   { featureType: "road", elementType: "geometry", stylers: [{ color: "#F5EDE8" }] },
   { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#FF6725" }] },
   { featureType: "water", elementType: "geometry", stylers: [{ color: "#cfd9bd" }] },
   { featureType: "poi", stylers: [{ visibility: "off" }] },
   { featureType: "transit", stylers: [{ visibility: "off" }] },
];

const PropertyPlanetMapIntelligence = () => {
   const [active, setActive] = useState<MarkerType>(markers[0]);

   const { isLoaded, loadError } = useJsApiLoader({
      id: "property-planet-google-map-script",
      googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
   });

   const highlightIcon = useMemo(() => {
      if (!isLoaded) return undefined;
      return {
         path: google.maps.SymbolPath.CIRCLE,
         scale: 10,
         fillColor: "#FF6725",
         fillOpacity: 1,
         strokeColor: "#fff",
         strokeWeight: 2,
      };
   }, [isLoaded]);

   const nodeIcon = useMemo(() => {
      if (!isLoaded) return undefined;
      return (selected: boolean) => ({
         path: google.maps.SymbolPath.CIRCLE,
         scale: 7,
         fillColor: selected ? "#FF3F25" : "#00B579",
         fillOpacity: 1,
         strokeColor: "#fff",
         strokeWeight: 2,
      });
   }, [isLoaded]);

   const airportIcon = useMemo(() => {
      if (!isLoaded) return undefined;
      return {
         path: google.maps.SymbolPath.CIRCLE,
         scale: 5,
         fillColor: "#7a8fa6",
         fillOpacity: 1,
         strokeColor: "#fff",
         strokeWeight: 1.5,
      };
   }, [isLoaded]);

   const hasApiKey = Boolean(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY);

   return (
      <div className="property-planet-map-intel position-relative z-1 mt-150 xl-mt-120 md-mt-80">
         <div className="container">
            <div className="title-one text-center mb-50 lg-mb-30 wow fadeInUp">
               <h2 className="font-garamond">Property Planet Property Intelligence</h2>
               <p className="fs-22 mt-xs">Southern Hyderabad&apos;s growth corridors, centred on Future City.</p>
            </div>

            <div className="map-frame position-relative wow fadeInUp">
               <div className="map-canvas">
                  {!hasApiKey ? (
                     <div className="map-fallback d-flex align-items-center justify-content-center text-center">
                        <div>
                           <i className="fa-regular fa-map-location-dot fs-2 mb-2 d-block"></i>
                           Live map requires a Google Maps API key.<br />
                           Set <code>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> in your environment.
                        </div>
                     </div>
                  ) : loadError ? (
                     <div className="map-fallback d-flex align-items-center justify-content-center text-center">
                        Couldn&apos;t load Google Maps. Check the API key and enabled APIs.
                     </div>
                  ) : !isLoaded ? (
                     <div className="map-fallback d-flex align-items-center justify-content-center text-center">
                        Loading map…
                     </div>
                  ) : (
                     <GoogleMap
                        mapContainerStyle={MAP_CONTAINER_STYLE}
                        center={{ lat: 17.16, lng: 78.5 }}
                        zoom={11}
                        options={{
                           styles: MAP_STYLES,
                           disableDefaultUI: true,
                           zoomControl: true,
                           streetViewControl: false,
                           mapTypeControl: false,
                           fullscreenControl: false,
                        }}
                     >
                        <Marker
                           position={HYDERABAD_AIRPORT}
                           icon={airportIcon}
                           title={HYDERABAD_AIRPORT.name}
                        />
                        {markers.map((m) => (
                           <Marker
                              key={m.id}
                              position={{ lat: m.lat, lng: m.lng }}
                              icon={m.highlight ? highlightIcon : nodeIcon && nodeIcon(active.id === m.id)}
                              title={m.name}
                              onClick={() => setActive(m)}
                           />
                        ))}
                     </GoogleMap>
                  )}
               </div>

               <div className="intel-panel">
                  <div className="intel-title fw-500">PROPERTY PLANET PROPERTY INTELLIGENCE</div>
                  <div className="intel-location fs-20 fw-500 mt-2">{active.name}</div>
                  <ul className="style-none intel-stats mt-3">
                     <li><span>Verified Opportunities</span><strong>{12 + (active.id % 5) * 4}</strong></li>
                     <li><span>Growth Corridor</span><strong>Southern Hyderabad</strong></li>
                     <li><span>Airport Distance</span><strong>{18 + (active.id % 6) * 3} km</strong></li>
                     <li><span>ORR Distance</span><strong>{4 + (active.id % 4) * 2} km</strong></li>
                  </ul>
                  <div className="intel-disclaimer fs-12 opacity-65 mt-3">Demo / Prototype data for illustration only.</div>
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
            .map-fallback code {
               background: #FFF8F4;
               padding: 2px 6px;
               border-radius: 4px;
               font-size: 12px;
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
               width: 240px;
               box-shadow: 0 12px 30px rgba(20, 20, 10, 0.08);
               pointer-events: none;
            }
            .intel-title {
               font-size: 11px;
               letter-spacing: 1px;
               color: #FF3F25;
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
         `}</style>
      </div>
   )
}

export default PropertyPlanetMapIntelligence
