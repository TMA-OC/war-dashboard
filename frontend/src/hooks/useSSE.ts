"use client";
import { useEffect, useCallback, useRef } from "react";
import type { Alert } from "@/types";
import { API_URL } from "@/lib/api";
import { sendLocalNotification } from "@/lib/notifications";

export function useSSE(token: string | undefined, onAlert: (alert: Alert) => void) {
  const onAlertRef = useRef(onAlert);
  onAlertRef.current = onAlert;

  const connect = useCallback(() => {
    if (!token) return;
    const url = `${API_URL}/sse?token=${encodeURIComponent(token)}`;
    const es = new EventSource(url);
    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === "alert") {
          const alert: Alert = data.alert;
          onAlertRef.current(alert);

          // Trigger local notification for high-confidence alerts
          if (alert.confidenceScore >= 70) {
            const title = alert.isBreaking
              ? `🚨 BREAKING: ${alert.headline}`
              : `⚔️ ${alert.headline}`;
            const body = alert.summary || alert.headline;
            sendLocalNotification(title, body, alert.confidenceScore).catch(() => {});
          }
        }
      } catch {}
    };
    es.onerror = () => {
      es.close();
      setTimeout(connect, 5000);
    };
    return es;
  }, [token]);

  useEffect(() => {
    const es = connect();
    return () => es?.close();
  }, [connect]);
}
