"use client";

import { MapContainer, TileLayer, Polyline, useMap } from "react-leaflet";
import { useEffect } from "react";
import L from "leaflet";

interface Position {
  lat: number;
  lng: number;
  timestamp: number;
}

function CenterMap({ positions }: { positions: Position[] }) {
  const map = useMap();

  useEffect(() => {
    if (positions.length > 0) {
      const last = positions[positions.length - 1];
      map.setView([last.lat, last.lng], map.getZoom());
    }
  }, [positions, map]);

  return null;
}

function CurrentMarker({
  center,
  radius,
  fillColor,
  fillOpacity,
  color,
  weight,
}: {
  center: [number, number];
  radius: number;
  fillColor: string;
  fillOpacity: number;
  color: string;
  weight: number;
}) {
  const map = useMap();

  useEffect(() => {
    const marker = L.circleMarker(center, {
      radius,
      fillColor,
      fillOpacity,
      color,
      weight,
    }).addTo(map);

    return () => {
      marker.remove();
    };
  }, [center, radius, fillColor, fillOpacity, color, weight, map]);

  return null;
}

export default function MapView({
  positions,
}: {
  positions: Position[];
}) {
  const defaultCenter: [number, number] = [10.2469, -67.5974]; // Maracay

  const path =
    positions.length > 0
      ? positions.map((p) => [p.lat, p.lng] as [number, number])
      : [];

  return (
    <MapContainer
      center={defaultCenter}
      zoom={14}
      className="h-full w-full"
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />
      {path.length > 1 && (
        <Polyline
          positions={path}
          pathOptions={{
            color: "#741717",
            weight: 4,
            opacity: 0.9,
          }}
        />
      )}
      {positions.length > 0 && (
        <CurrentMarker
          center={path[path.length - 1]}
          radius={6}
          fillColor="#BD695D"
          fillOpacity={1}
          color="#52130C"
          weight={2}
        />
      )}
      <CenterMap positions={positions} />
    </MapContainer>
  );
}
