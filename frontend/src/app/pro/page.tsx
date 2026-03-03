"use client";
import { useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useSSE } from "@/hooks/useSSE";
import { NewsTicker } from "@/components/pro/NewsTicker";
import { StatsPanel } from "@/components/pro/StatsPanel";
import { TopicFeed } from "@/components/pro/TopicFeed";
import { TimelineView } from "@/components/pro/TimelineView";
import type { Alert, Strike } from "@/types";
import dynamic from "next/dynamic";
import { BarChart2, Clock, Map, List } from "lucide-react";

const StrikesMap = dynamic(() => import("@/components/map/StrikesMap").then(m => ({ default: m.StrikesMap })), { ssr: false });

type ViewMode = "map" | "timeline" | "stats" | "feed";

export default function ProPage() {
  const { data: session } = useSession();
  const token = (session as any)?.accessToken as string | undefined;
  const [liveAlerts, setLiveAlerts] = useState<Alert[]>([]);
  const [view, setView] = useState<ViewMode>("map");

  const { data: alertsData, isLoading: alertsLoading } = useQuery({
    queryKey: ["pro-alerts"],
    queryFn: () => api.getAlerts({ limit: 100 }, token),
    refetchInterval: 30000,
  });

  const { data: strikesData, isLoading: strikesLoading } = useQuery({
    queryKey: ["strikes"],
    queryFn: () => api.getStrikes(token),
    refetchInterval: 30000,
  });

  const handleNewAlert = useCallback((alert: Alert) => {
    setLiveAlerts(prev => [alert, ...prev].slice(0, 50));
  }, []);

  useSSE(token, handleNewAlert);

  const allAlerts: Alert[] = [
    ...liveAlerts,
    ...((alertsData as any)?.alerts || []),
  ].filter((a, i, arr) => arr.findIndex(b => b.id === a.id) === i);

  const strikes: Strike[] = (strikesData as any)?.strikes || [];

  return (
    <div className="h-full flex flex-col" style={{ height: "calc(100vh - 48px)" }}>
      {/* Breaking ticker */}
      <NewsTicker alerts={allAlerts} />

      {/* Main grid - responsive: stack on mobile, side-by-side on desktop */}
      <div className="flex-1 flex flex-col lg:grid lg:grid-cols-[1fr_320px] overflow-hidden">
        {/* Left: Map / Timeline / Stats */}
        <div className="flex flex-col border-b lg:border-b-0 lg:border-r border-gray-800 overflow-hidden flex-1 min-h-0">
          {/* View tabs - scrollable on mobile */}
          <div className="flex items-center gap-1 px-3 py-2 border-b border-gray-800 shrink-0 overflow-x-auto">
            <div className="flex items-center gap-1 shrink-0">
              {[
                { id: "map" as ViewMode, label: "Map", icon: Map },
                { id: "timeline" as ViewMode, label: "Timeline", icon: Clock },
                { id: "stats" as ViewMode, label: "Stats", icon: BarChart2 },
                { id: "feed" as ViewMode, label: "Feed", icon: List, mobileOnly: true },
              ].map(v => (
                <button
                  key={v.id}
                  onClick={() => setView(v.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition whitespace-nowrap ${
                    view === v.id ? "bg-gray-800 text-white" : "text-gray-500 hover:text-gray-300"
                  } ${v.mobileOnly ? "lg:hidden" : ""}`}
                >
                  <v.icon className="w-3.5 h-3.5" />
                  {v.label}
                </button>
              ))}
            </div>
            {/* Legend - hidden on mobile */}
            <div className="ml-auto hidden md:flex items-center gap-2 text-xs text-gray-600 shrink-0">
              <span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> &lt;15m
              <span className="w-2 h-2 rounded-full bg-orange-500 inline-block" /> &lt;2h
              <span className="w-2 h-2 rounded-full bg-yellow-500 inline-block" /> Today
              <span className="w-2 h-2 rounded-full bg-gray-500 inline-block" /> Older
            </div>
          </div>
          {/* Content */}
          <div className="flex-1 overflow-hidden min-h-[300px] lg:min-h-0">
            {view === "map" && (
              <div className="h-full">
                {strikesLoading ? (
                  <div className="h-full flex items-center justify-center text-gray-600">Loading strikes map...</div>
                ) : (
                  <StrikesMap strikes={strikes} height="100%" />
                )}
              </div>
            )}
            {view === "timeline" && <TimelineView alerts={allAlerts} />}
            {view === "stats" && (
              <div className="p-4 space-y-4 overflow-y-auto h-full">
                <StatsPanel alerts={allAlerts} strikes={strikes} />
                <div className="bg-[#0d0d14] border border-gray-800 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-white mb-3">Confidence Distribution</h3>
                  {[
                    { label: "VERIFIED (≥90%)", count: allAlerts.filter(a => a.confidenceScore >= 90).length, color: "bg-green-500" },
                    { label: "LIKELY (70-89%)", count: allAlerts.filter(a => a.confidenceScore >= 70 && a.confidenceScore < 90).length, color: "bg-yellow-500" },
                    { label: "UNVERIFIED (50-69%)", count: allAlerts.filter(a => a.confidenceScore >= 50 && a.confidenceScore < 70).length, color: "bg-orange-500" },
                    { label: "RUMOR (<50%)", count: allAlerts.filter(a => a.confidenceScore < 50).length, color: "bg-red-500" },
                  ].map(row => (
                    <div key={row.label} className="flex items-center gap-3 mb-2">
                      <span className="text-xs text-gray-400 w-32 sm:w-40 shrink-0">{row.label}</span>
                      <div className="flex-1 bg-gray-800 rounded-full h-2 min-w-0">
                        <div
                          className={`h-2 rounded-full ${row.color}`}
                          style={{ width: allAlerts.length ? `${(row.count / allAlerts.length) * 100}%` : "0%" }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 w-6 text-right shrink-0">{row.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* Mobile-only feed view */}
            {view === "feed" && (
              <div className="lg:hidden h-full">
                {alertsLoading ? (
                  <div className="flex-1 flex items-center justify-center text-gray-600 text-sm">Loading...</div>
                ) : (
                  <TopicFeed alerts={allAlerts} />
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right panel: Topic feed - hidden on mobile (accessible via tab) */}
        <div className="hidden lg:flex flex-col overflow-hidden bg-[#08080f]">
          <div className="px-3 py-2 border-b border-gray-800 shrink-0">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Topic Feed</h2>
            {liveAlerts.length > 0 && (
              <div className="flex items-center gap-1 mt-1 text-xs text-green-400">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block" />
                {liveAlerts.length} live
              </div>
            )}
          </div>
          {alertsLoading ? (
            <div className="flex-1 flex items-center justify-center text-gray-600 text-sm">Loading...</div>
          ) : (
            <TopicFeed alerts={allAlerts} />
          )}
        </div>
      </div>
    </div>
  );
}
