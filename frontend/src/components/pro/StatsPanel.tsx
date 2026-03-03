"use client";
import type { Alert, Strike } from "@/types";

interface StatsPanelProps {
  alerts: Alert[];
  strikes: Strike[];
}

export function StatsPanel({ alerts, strikes }: StatsPanelProps) {
  const confirmedStrikes = strikes.filter(s => s.confidenceScore >= 70).length;
  const verifiedAlerts = alerts.filter(a => a.confidenceScore >= 90).length;
  const conflictStart = new Date("2023-10-07");
  const daysOfConflict = Math.floor((Date.now() - conflictStart.getTime()) / 86400000);

  const stats = [
    { label: "Confirmed Strikes", value: confirmedStrikes.toString(), color: "text-red-400" },
    { label: "Verified Alerts", value: verifiedAlerts.toString(), color: "text-green-400" },
    { label: "Days of Conflict", value: daysOfConflict.toString(), color: "text-orange-400" },
    { label: "Sources Monitored", value: "24", color: "text-blue-400" },
  ];

  return (
    <div className="grid grid-cols-2 gap-2 w-full max-w-full">
      {stats.map(s => (
        <div key={s.label} className="bg-[#0d0d14] border border-gray-800 rounded-lg p-2 sm:p-3 overflow-hidden">
          <div className={`text-xl sm:text-2xl font-black font-mono ${s.color} truncate`}>{s.value}</div>
          <div className="text-xs text-gray-500 mt-0.5 truncate">{s.label}</div>
        </div>
      ))}
    </div>
  );
}
