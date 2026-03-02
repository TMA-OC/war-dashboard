"use client";
import { useEffect, useRef } from "react";
import type { Alert, Pin } from "@/types";

interface AlertMapProps {
  alerts: Alert[];
  pins: Pin[];
  height?: string;
}

export function AlertMap({ alerts, pins, height = "400px" }: AlertMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!mapRef.current) return;
    if (mapInstanceRef.current) return;

    // Dynamically import Leaflet
    import("leaflet").then((L) => {
      if (!mapRef.current) return;
      // Fix default icon
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const map = L.map(mapRef.current!, { zoomControl: true, attributionControl: false });
      mapInstanceRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
      }).addTo(map);

      map.setView([32, 35], 5);

      // Add pin markers
      pins.forEach(pin => {
        if (!pin.isActive) return;
        L.circle([pin.lat, pin.lng], {
          radius: pin.radiusKm * 1000,
          color: "#3b82f6",
          fillColor: "#3b82f6",
          fillOpacity: 0.08,
          weight: 1.5,
        }).addTo(map);

        L.marker([pin.lat, pin.lng], {
          icon: L.divIcon({
            className: "",
            html: `<div style="background:#3b82f6;width:12px;height:12px;border-radius:50%;border:2px solid white;box-shadow:0 0 8px rgba(59,130,246,0.8)"></div>`,
            iconSize: [12, 12],
            iconAnchor: [6, 6],
          }),
        }).addTo(map).bindPopup(`<b>${pin.label}</b><br/>Radius: ${pin.radiusKm}km`);
      });

      // Add alert markers
      alerts.filter(a => a.lat && a.lng).forEach(alert => {
        L.marker([alert.lat!, alert.lng!], {
          icon: L.divIcon({
            className: "",
            html: `<div style="background:#f97316;width:8px;height:8px;border-radius:50%;border:1.5px solid white;box-shadow:0 0 6px rgba(249,115,22,0.8)"></div>`,
            iconSize: [8, 8],
            iconAnchor: [4, 4],
          }),
        }).addTo(map).bindPopup(`<b>${alert.headline}</b>`);
      });
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update markers when data changes
  useEffect(() => {
    // Map will be updated via key re-render for simplicity
  }, [alerts, pins]);

  return (
    <>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <div ref={mapRef} style={{ height, width: "100%" }} className="rounded-lg overflow-hidden" />
    </>
  );
}
