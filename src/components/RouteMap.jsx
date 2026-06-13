import { useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Polyline,
  CircleMarker,
  Tooltip,
  useMap,
} from "react-leaflet";
import { STOP_META } from "../lib/status.js";

function FitBounds({ points }) {
  const map = useMap();
  useEffect(() => {
    if (points.length) {
      map.fitBounds(points, { padding: [40, 40] });
    }
  }, [points, map]);
  return null;
}

export default function RouteMap({ trip }) {
  const { route, stops, points } = trip;
  const line = route.geometry;

  const endpoints = [
    { ...points.current, color: "#0f2747", label: points.current.label, role: "Start" },
    { ...points.pickup, color: "#d97706", label: points.pickup.label, role: "Pickup" },
    { ...points.dropoff, color: "#16a34a", label: points.dropoff.label, role: "Drop-off" },
  ];

  const bounds = line.map(([lat, lng]) => [lat, lng]);

  return (
    <div className="h-[420px] overflow-hidden rounded-xl border border-line shadow-card">
      <MapContainer
        center={line[0]}
        zoom={6}
        scrollWheelZoom={true}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds points={bounds} />

        <Polyline
          positions={line}
          pathOptions={{ color: "#ffffff", weight: 7, opacity: 0.9 }}
        />
        <Polyline
          positions={line}
          pathOptions={{ color: "#0f2747", weight: 3, opacity: 0.95 }}
        />

        {/* Intermediate stops: fuel, rests, restarts */}
        {stops
          .filter((s) => s.type === "fuel" || s.type.startsWith("rest") || s.type.startsWith("break"))
          .map((s, i) => {
            const meta = STOP_META[s.type] || { color: "#888", label: s.type };
            return (
              <CircleMarker
                key={`stop-${i}`}
                center={[s.lat, s.lng]}
                radius={6}
                pathOptions={{ color: "#ffffff", weight: 2, fillColor: meta.color, fillOpacity: 1 }}
              >
                <Tooltip direction="top">{s.label}</Tooltip>
              </CircleMarker>
            );
          })}

        {/* Endpoints on top */}
        {endpoints.map((p, i) => (
          <CircleMarker
            key={`end-${i}`}
            center={[p.lat, p.lng]}
            radius={9}
            pathOptions={{ color: "#ffffff", weight: 2.5, fillColor: p.color, fillOpacity: 1 }}
          >
            <Tooltip direction="top" permanent={false}>
              {p.role}: {p.label}
            </Tooltip>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
