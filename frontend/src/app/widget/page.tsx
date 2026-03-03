"use client";
import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AlertCard } from "@/components/alerts/AlertCard";
import type { Alert } from "@/types";
import { API_URL } from "@/lib/api";

function WidgetContent() {
  const searchParams = useSearchParams();
  const limit = parseInt(searchParams.get("limit") || "10", 10);
  const minConfidence = parseInt(searchParams.get("confidence") || "0", 10);
  const topic = searchParams.get("topic") || null;

  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initial fetch
  useEffect(() => {
    const params = new URLSearchParams();
    params.set("limit", String(limit));
    if (minConfidence > 0) params.set("minConfidence", String(minConfidence));

    fetch(`${API_URL}/alerts?${params}`)
      .then(r => r.json())
      .then((data: { alerts: Alert[] }) => {
        let result = data.alerts || [];
        if (topic) {
          result = result.filter(a =>
            a.topics?.some(t => t.toLowerCase().includes(topic.toLowerCase()))
          );
        }
        setAlerts(result.slice(0, limit));
        setLoading(false);
      })
      .catch(err => {
        setError("Failed to load alerts");
        setLoading(false);
      });
  }, [limit, minConfidence, topic]);

  // Live SSE updates (no auth required — public alerts endpoint)
  useEffect(() => {
    const es = new EventSource(`${API_URL}/sse/public`);
    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === "alert") {
          const alert: Alert = data.alert;
          if (alert.confidenceScore < minConfidence) return;
          if (topic && !alert.topics?.some(t => t.toLowerCase().includes(topic.toLowerCase()))) return;
          setAlerts(prev => [alert, ...prev].slice(0, limit));
        }
      } catch {}
    };
    es.onerror = () => es.close();
    return () => es.close();
  }, [limit, minConfidence, topic]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32 text-gray-500 text-sm">
        Loading alerts…
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-32 text-red-400 text-sm">
        {error}
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-gray-500 text-sm">
        No alerts matching your filters.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 p-2">
      {alerts.map(alert => (
        <AlertCard key={alert.id} alert={alert} compact />
      ))}
    </div>
  );
}

export default function WidgetPage() {
  return (
    <div
      style={{ background: "#0a0a0a", minHeight: "100vh", color: "white", fontFamily: "system-ui, sans-serif" }}
      className="overflow-y-auto"
    >
      <Suspense fallback={
        <div className="flex items-center justify-center h-32 text-gray-500 text-sm">
          Loading…
        </div>
      }>
        <WidgetContent />
      </Suspense>
    </div>
  );
}
