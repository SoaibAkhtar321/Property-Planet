"use client"
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap } from "react-leaflet"
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
         style={{ width: "100%", height: "100%" }}
         scrollWheelZoom={false}
      >
         <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
         />

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
