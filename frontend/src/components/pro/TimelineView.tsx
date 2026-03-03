"use client";
import type { Alert } from "@/types";
import { getConfidenceBadge, formatRelativeTime } from "@/lib/utils";
import { ExternalLink } from "lucide-react";

export function TimelineView({ alerts }: { alerts: Alert[] }) {
  const sorted = [...alerts].sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  return (
    <div className="h-full overflow-y-auto p-2 sm:p-3 w-full max-w-full">
      <div className="relative">
        <div className="absolute left-2 sm:left-3 top-0 bottom-0 w-px bg-gray-800" />
        <div className="space-y-2 sm:space-y-3">
          {sorted.slice(0, 100).map((alert) => {
            const badge = getConfidenceBadge(alert.confidenceScore);
            return (
              <div key={alert.id} className="relative pl-6 sm:pl-8">
                <div className={`absolute left-0.5 sm:left-1.5 top-2 w-3 h-3 rounded-full border-2 border-[#060609] ${
                  alert.isBreaking ? "bg-red-500" :
                  alert.confidenceScore >= 90 ? "bg-green-500" :
                  alert.confidenceScore >= 70 ? "bg-yellow-500" :
                  "bg-gray-600"
                }`} />
                <div className="bg-[#0d0d14] border border-gray-800 rounded-lg p-2 sm:p-2.5 overflow-hidden">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs text-white leading-tight break-words flex-1 min-w-0">{alert.headline}</p>
                    <a href={alert.url} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-blue-400 shrink-0">
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2 mt-1.5 flex-wrap">
                    <span className={`text-xs font-bold ${badge.color}`}>{badge.emoji} {badge.label}</span>
                    <span className="text-xs text-gray-500">{formatRelativeTime(alert.publishedAt)}</span>
                    {alert.source && <span className="text-xs text-gray-600 truncate max-w-[100px]">{alert.source.name}</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
