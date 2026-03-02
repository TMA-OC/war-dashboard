import { Alert } from "@/types";
import { getConfidenceBadge, formatRelativeTime, cn } from "@/lib/utils";
import { ExternalLink, MapPin } from "lucide-react";

export function AlertCard({ alert, compact = false }: { alert: Alert; compact?: boolean }) {
  const badge = getConfidenceBadge(alert.confidenceScore);

  return (
    <div className={cn(
      "bg-[#12121a] border rounded-xl p-4 hover:border-gray-600 transition-all",
      alert.isBreaking ? "border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.1)]" : "border-gray-800"
    )}>
      {alert.isBreaking && (
        <div className="flex items-center gap-1.5 mb-2">
          <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-red-400 text-xs font-bold tracking-widest uppercase">Breaking</span>
        </div>
      )}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className={cn("font-semibold text-white leading-snug", compact ? "text-sm" : "text-base")}>
            {alert.headline}
          </h3>
          {!compact && alert.summary && (
            <p className="mt-1.5 text-gray-400 text-sm leading-relaxed line-clamp-2">{alert.summary}</p>
          )}
        </div>
        <span className={cn("shrink-0 text-xs font-bold px-2 py-1 rounded-full border", badge.bg, badge.color)}>
          {badge.emoji} {badge.label}
        </span>
      </div>
      <div className="mt-3 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-3 text-xs text-gray-500">
          {alert.source && (
            <span className="text-gray-400 font-medium">{alert.source.name}</span>
          )}
          {alert.locationName && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {alert.locationName}
            </span>
          )}
          <span>{formatRelativeTime(alert.publishedAt)}</span>
        </div>
        {alert.topics.length > 0 && (
          <div className="flex gap-1 flex-wrap">
            {alert.topics.slice(0, 3).map(t => (
              <span key={t} className="text-xs px-2 py-0.5 bg-blue-900/30 text-blue-300 rounded-full border border-blue-800/30">{t}</span>
            ))}
          </div>
        )}
        <a
          href={alert.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 hover:text-blue-300 transition"
        >
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}
