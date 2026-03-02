import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return diffMin + "m ago";
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return diffH + "h ago";
  return Math.floor(diffH / 24) + "d ago";
}

export function getConfidenceBadge(score: number) {
  if (score >= 90) return { label: "VERIFIED", color: "text-green-400", bg: "bg-green-400/10 border-green-400/30", emoji: "🟢" };
  if (score >= 70) return { label: "LIKELY", color: "text-yellow-400", bg: "bg-yellow-400/10 border-yellow-400/30", emoji: "🟡" };
  if (score >= 50) return { label: "UNVERIFIED", color: "text-orange-400", bg: "bg-orange-400/10 border-orange-400/30", emoji: "🟠" };
  return { label: "RUMOR", color: "text-red-400", bg: "bg-red-400/10 border-red-400/30", emoji: "🔴" };
}

export function getStrikeMarkerColor(publishedAt: Date | string): string {
  const d = typeof publishedAt === "string" ? new Date(publishedAt) : publishedAt;
  const diffMin = (Date.now() - d.getTime()) / 60000;
  if (diffMin < 15) return "#ef4444";
  if (diffMin < 120) return "#f97316";
  if (d.toDateString() === new Date().toDateString()) return "#eab308";
  return "#6b7280";
}
