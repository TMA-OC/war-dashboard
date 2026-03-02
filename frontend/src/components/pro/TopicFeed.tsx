"use client";
import { useState } from "react";
import type { Alert } from "@/types";

import { formatRelativeTime, getConfidenceBadge } from "@/lib/utils";
import { ExternalLink } from "lucide-react";

const TOPICS = ["All", "Airstrikes", "Missile launches", "Ceasefire", "Sanctions", "Nuclear", "Ground ops", "Casualties", "Diplomatic"];

export function TopicFeed({ alerts }: { alerts: Alert[] }) {
  const [topic, setTopic] = useState("All");

  const filtered = topic === "All"
    ? alerts
    : alerts.filter(a => a.topics.some(t => t.toLowerCase().includes(topic.toLowerCase())));

  return (
    <div className="flex flex-col h-full">
      {/* Topic filters */}
      <div className="flex gap-1 flex-wrap p-2 border-b border-gray-800 shrink-0">
        {TOPICS.map(t => (
          <button
            key={t}
            onClick={() => setTopic(t)}
            className={`text-xs px-2 py-1 rounded transition ${
              topic === t ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"
            }`}
          >
            {t}
          </button>
        ))}
      </div>
      {/* Feed */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {filtered.length === 0 && (
          <div className="text-center py-8 text-gray-600 text-sm">No alerts for this topic</div>
        )}
        {filtered.slice(0, 50).map(alert => {
          const badge = getConfidenceBadge(alert.confidenceScore);
          return (
            <div key={alert.id} className="p-2.5 bg-[#0d0d14] border border-gray-800 rounded-lg">
              <div className="flex items-start gap-2">
                <span className={`text-xs font-bold ${badge.color} shrink-0 mt-0.5`}>{badge.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-white leading-tight line-clamp-2">{alert.headline}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-500">{formatRelativeTime(alert.publishedAt)}</span>
                    {alert.locationName && <span className="text-xs text-gray-600">{alert.locationName}</span>}
                  </div>
                </div>
                <a href={alert.url} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-blue-400 transition shrink-0">
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
