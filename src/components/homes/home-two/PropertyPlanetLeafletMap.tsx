"use client"
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap, ZoomControl, LayersControl, LayerGroup } from "react-leaflet"
import { useEffect } from "react"

interface MarkerType {
   id: number;
   name: string;
   lat: number;
   lng: number;
   priority: number;
}

interface Props {
   center: [number, number];
   markers: MarkerType[];
   airport: { lat: number; lng: number; name: string };
   activeId: number;
   onSelect: (id: number) => void;
}

// Recenters the map when the active marker changes, without remounting
// the whole map (which would reset zoom/pan on every click).
const FlyToActive = ({ lat, lng }: { lat: number; lng: number }) => {
   const map = useMap();
   useEffect(() => {
      map.flyTo([lat, lng], map.getZoom(), { duration: 0.6 });
   }, [lat, lng, map]);
   return null;
};

const PropertyPlanetLeafletMap = ({ center, markers, airport, activeId, onSelect }: Props) => {
   const active = markers.find((m) => m.id === activeId);

   return (
      <MapContainer
         center={center}
         zoom={11}
         // Default zoom buttons sat top-left, underneath the corridor info
         // panel on desktop; they're rendered top-right below instead.
         zoomControl={false}
         style={{ width: "100%", height: "100%" }}
         scrollWheelZoom={false}
      >
         <ZoomControl position="topright" />
         {/* Base-map switcher (top-right, under the zoom buttons). Satellite is
             the default: buyers looking at land want to see the actual
             ground. Its labels overlay keeps village/road names readable. */}
         <LayersControl position="topright">
            <LayersControl.BaseLayer checked name="Satellite">
               <LayerGroup>
                  <TileLayer
                     attribution='Imagery &copy; <a href="https://www.esri.com/">Esri</a>, Maxar, Earthstar Geographics'
                     url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                     maxZoom={19}
                  />
                  <TileLayer
                     url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
                     maxZoom={19}
                  />
               </LayerGroup>
            </LayersControl.BaseLayer>
            <LayersControl.BaseLayer name="Terrain">
               <TileLayer
                  attribution='Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, SRTM | Style &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (CC-BY-SA)'
                  url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
                  maxZoom={17}
               />
            </LayersControl.BaseLayer>
            <LayersControl.BaseLayer name="Map">
               <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
               />
            </LayersControl.BaseLayer>
         </LayersControl>

         <CircleMarker
            center={[airport.lat, airport.lng]}
            radius={6}
            pathOptions={{ color: "#fff", weight: 1.5, fillColor: "#7a8fa6", fillOpacity: 1 }}
         >
            <Tooltip direction="top">{airport.name}</Tooltip>
         </CircleMarker>

         {markers.map((m) => (
            <CircleMarker
               key={m.id}
               center={[m.lat, m.lng]}
               radius={m.id === activeId ? 10 : 7}
               pathOptions={{
                  color: "#fff",
                  weight: 2,
                  fillColor: m.id === activeId ? "#178C48" : "#00B579",
                  fillOpacity: 1,
               }}
               eventHandlers={{ click: () => onSelect(m.id) }}
            >
               <Tooltip direction="top">{m.name} (#{m.priority})</Tooltip>
            </CircleMarker>
         ))}

         {active && <FlyToActive lat={active.lat} lng={active.lng} />}
      </MapContainer>
   );
};

export default PropertyPlanetLeafletMap
