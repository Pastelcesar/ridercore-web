"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix para los iconos de Leaflet en Next.js
const customIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

interface TelemetryPoint {
  id: string;
  pilot?: string;
  latitude?: number;
  longitude?: number;
}

interface MapProps {
  telemetryData: TelemetryPoint[];
}

export default function Map({ telemetryData }: MapProps) {
  // Coordenadas por defecto (CDMX)
  const defaultCenter: [number, number] = [19.4326, -99.1332];

  // Filtramos datos para asegurarnos de que tengan coordenadas válidas
  const validPoints = (telemetryData || []).filter(
    (p) => typeof p?.latitude === "number" && typeof p?.longitude === "number"
  );

  const center: [number, number] =
    validPoints.length > 0
      ? [validPoints[0].latitude!, validPoints[0].longitude!]
      : defaultCenter;

  return (
    <div className="w-full h-[450px] rounded-2xl overflow-hidden border border-cyan-500/30 shadow-2xl relative z-0">
      <MapContainer
        center={center}
        zoom={13}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
       <TileLayer
  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
/>

        {/* Solo renderiza marcadores que tengan coordenadas válidas */}
        {validPoints.map((point) => (
          <Marker
            key={point.id}
            position={[point.latitude!, point.longitude!]}
            icon={customIcon}
          >
            <Popup>
              <div className="text-black font-sans">
                <strong>Piloto:</strong> {point.pilot || "Sin Nombre"} <br />
                <strong>Lat:</strong> {point.latitude!.toFixed(4)} <br />
                <strong>Lng:</strong> {point.longitude!.toFixed(4)}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}