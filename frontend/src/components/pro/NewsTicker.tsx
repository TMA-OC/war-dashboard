"use client";
import type { Alert } from "@/types";

export function NewsTicker({ alerts }: { alerts: Alert[] }) {
  const breaking = alerts.filter(a => a.isBreaking);
  const items = breaking.length > 0 ? breaking : alerts.slice(0, 10);

  if (items.length === 0) return null;

  const text = items.map(a => `◆ ${a.headline}`).join("   ");

  return (
    <div className="bg-red-950/80 border-b border-red-800/50 h-9 flex items-center overflow-hidden shrink-0">
      <div className="shrink-0 bg-red-600 px-3 h-full flex items-center text-xs font-black tracking-widest text-white uppercase">
        BREAKING
      </div>
      <div className="flex-1 overflow-hidden relative">
        <div className="ticker-animate whitespace-nowrap text-sm text-red-200 font-medium">
          {text}&nbsp;&nbsp;&nbsp;{text}
        </div>
      </div>
    </div>
  );
}
