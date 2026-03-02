"use client";
import { useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useSSE } from "@/hooks/useSSE";
import { AlertCard } from "@/components/alerts/AlertCard";
import type { Alert } from "@/types";
import { RefreshCw, Filter } from "lucide-react";

const TOPICS = ["All", "Airstrikes", "Missile launches", "Ceasefire", "Sanctions", "Nuclear", "Ground ops", "Casualties"];

export default function DashboardPage() {
  const { data: session } = useSession();
  const token = (session as any)?.accessToken as string | undefined;
  const queryClient = useQueryClient();
  const [topicFilter, setTopicFilter] = useState("All");
  const [minConfidence, setMinConfidence] = useState(0);
  const [liveAlerts, setLiveAlerts] = useState<Alert[]>([]);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["alerts", topicFilter, minConfidence],
    queryFn: () => api.getAlerts({ limit: 50, minConfidence: minConfidence || undefined }, token),
    refetchInterval: 60000,
  });

  const handleNewAlert = useCallback((alert: Alert) => {
    setLiveAlerts(prev => [alert, ...prev].slice(0, 20));
  }, []);

  useSSE(token, handleNewAlert);

  const allAlerts: Alert[] = [
    ...liveAlerts,
    ...((data as any)?.alerts || []),
  ].filter((a, i, arr) => arr.findIndex(b => b.id === a.id) === i);

  const filtered = topicFilter === "All"
    ? allAlerts
    : allAlerts.filter(a => a.topics.some(t => t.toLowerCase().includes(topicFilter.toLowerCase())));

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Intelligence Feed</h1>
          <p className="text-sm text-gray-400">{filtered.length} alerts • Live updates active</p>
        </div>
        <button
          onClick={() => refetch()}
          className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap items-center">
        <Filter className="w-4 h-4 text-gray-500" />
        {TOPICS.map(t => (
          <button
            key={t}
            onClick={() => setTopicFilter(t)}
            className={`text-xs px-3 py-1 rounded-full border transition ${
              topicFilter === t
                ? "bg-blue-600 border-blue-600 text-white"
                : "border-gray-700 text-gray-400 hover:border-gray-500"
            }`}
          >
            {t}
          </button>
        ))}
        <select
          value={minConfidence}
          onChange={e => setMinConfidence(Number(e.target.value))}
          className="ml-auto text-xs bg-[#1a1a28] border border-gray-700 text-gray-300 rounded-lg px-2 py-1"
        >
          <option value={0}>All confidence</option>
          <option value={50}>≥50% Unverified</option>
          <option value={70}>≥70% Likely</option>
          <option value={90}>≥90% Verified</option>
        </select>
      </div>

      {/* Live badge */}
      {liveAlerts.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-green-400">
          <span className="inline-block w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          {liveAlerts.length} new live alert{liveAlerts.length > 1 ? "s" : ""} received
        </div>
      )}

      {/* Alert feed */}
      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-24 bg-[#12121a] rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-xl text-red-400 text-sm">
          Failed to load alerts. The API may be unavailable.
        </div>
      )}

      {!isLoading && !error && filtered.length === 0 && (
        <div className="text-center py-16 text-gray-500">
          <p className="text-4xl mb-3">📡</p>
          <p>No alerts found. Waiting for intelligence...</p>
        </div>
      )}

      <div className="space-y-3">
        {filtered.map(alert => (
          <AlertCard key={alert.id} alert={alert} />
        ))}
      </div>
    </div>
  );
}
