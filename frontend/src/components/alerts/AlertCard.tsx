import { Alert } from "@/types";
import { getConfidenceBadge, formatRelativeTime, cn } from "@/lib/utils";
import { ExternalLink, MapPin } from "lucide-react";

export function AlertCard({ alert, compact = false }: { alert: Alert; compact?: boolean }) {
  const badge = getConfidenceBadge(alert.confidenceScore);

  return (
    <div className={cn(
      "bg-[#12121a] border rounded-xl p-3 sm:p-4 hover:border-gray-600 transition-all w-full max-w-full overflow-hidden",
      alert.isBreaking ? "border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.1)]" : "border-gray-800"
    )}>
      {alert.isBreaking && (
        <div className="flex items-center gap-1.5 mb-2">
          <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-red-400 text-xs font-bold tracking-widest uppercase">Breaking</span>
        </div>
      )}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-3">
        <div className="flex-1 min-w-0">
          <h3 className={cn("font-semibold text-white leading-snug break-words", compact ? "text-sm" : "text-sm sm:text-base")}>
            {alert.headline}
          </h3>
          {!compact && alert.summary && (
            <p className="mt-1.5 text-gray-400 text-sm leading-relaxed line-clamp-2 break-words">{alert.summary}</p>
          )}
        </div>
        <span className={cn("shrink-0 text-xs font-bold px-2 py-1 rounded-full border self-start", badge.bg, badge.color)}>
          {badge.emoji} {badge.label}
        </span>
      </div>
      <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 w-full">
        <div className="flex items-center gap-2 sm:gap-3 text-xs text-gray-500 flex-wrap min-w-0">
          {alert.source && (
            <span className="text-gray-400 font-medium truncate max-w-[150px]">{alert.source.name}</span>
          )}
          {alert.locationName && (
            <span className="flex items-center gap-1 truncate max-w-[150px]">
              <MapPin className="w-3 h-3 shrink-0" />
              <span className="truncate">{alert.locationName}</span>
            </span>
          )}
          <span className="shrink-0">{formatRelativeTime(alert.publishedAt)}</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {alert.topics.length > 0 && (
            <div className="flex gap-1 flex-wrap">
              {alert.topics.slice(0, 3).map(t => (
                <span key={t} className="text-xs px-2 py-0.5 bg-blue-900/30 text-blue-300 rounded-full border border-blue-800/30 whitespace-nowrap">{t}</span>
              ))}
            </div>
          )}
          <a
            href={alert.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 transition shrink-0"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
}
