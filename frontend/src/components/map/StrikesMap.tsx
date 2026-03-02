"use client";
import { useEffect, useRef } from "react";
import type { Strike } from "@/types";
import { getStrikeMarkerColor } from "@/lib/utils";

interface StrikesMapProps {
  strikes: Strike[];
  height?: string;
}

export function StrikesMap({ strikes, height = "100%" }: StrikesMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  useEffect(() => {
    if (typeof window === "undefined" || !mapRef.current || mapInstanceRef.current) return;

    import("leaflet").then((L) => {
      if (!mapRef.current) return;
      delete (L.Icon.Default.prototype as any)._getIconUrl;

      const map = L.map(mapRef.current!, {
        zoomControl: true,
        attributionControl: false,
        preferCanvas: true,
      });
      mapInstanceRef.current = map;

      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        attribution: "© OpenStreetMap © CARTO",
        subdomains: "abcd",
        maxZoom: 20,
      }).addTo(map);

      map.setView([32, 40], 4);
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current) return;
    import("leaflet").then((L) => {
      const map = mapInstanceRef.current;
      // Clear old markers
      markersRef.current.forEach(m => map.removeLayer(m));
      markersRef.current = [];

      strikes.forEach(strike => {
        const color = getStrikeMarkerColor(strike.publishedAt);
        const marker = L.circleMarker([strike.lat, strike.lng], {
          radius: 8,
          color: color,
          fillColor: color,
          fillOpacity: 0.7,
          weight: 2,
        }).addTo(map);

        marker.bindPopup(`
          <div style="min-width:160px">
            <b>${strike.locationName || "Unknown Location"}</b><br/>
            Type: ${strike.strikeType || "N/A"}<br/>
            Casualties: ${strike.casualties ?? "Unknown"}<br/>
            Confidence: ${Math.round(strike.confidenceScore)}%<br/>
            ${new Date(strike.publishedAt).toLocaleString()}
          </div>
        `);
        markersRef.current.push(marker);
      });
    });
  }, [strikes]);

  return (
    <>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <div ref={mapRef} style={{ height: height === "100%" ? "100%" : height, width: "100%" }} />
    </>
  );
}
