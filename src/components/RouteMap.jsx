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
    { ...points.current, type: "pickup", label: points.current.label, role: "Start" },
    { ...points.pickup, type: "pickup", label: points.pickup.label, role: "Pickup" },
    { ...points.dropoff, type: "dropoff", label: points.dropoff.label, role: "Drop-off" },
  ];

  const bounds = line.map(([lat, lng]) => [lat, lng]);

  return (
    <div className="h-[420px] overflow-hidden rounded-lg border border-ink-700">
      <MapContainer
        center={line[0]}
        zoom={6}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds points={bounds} />

        <Polyline
          positions={line}
          pathOptions={{ color: "#E8A317", weight: 4, opacity: 0.9 }}
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
                pathOptions={{ color: "#16202E", weight: 2, fillColor: meta.color, fillOpacity: 1 }}
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
            pathOptions={{ color: "#16202E", weight: 2, fillColor: "#F6B82E", fillOpacity: 1 }}
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
