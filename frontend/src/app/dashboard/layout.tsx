"use client";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Map, Settings, LogOut, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { requestNotificationPermission } from "@/lib/notifications";
import type { UserPreferences } from "@/types";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const token = (session as any)?.accessToken as string | undefined;
  const pathname = usePathname();

  const { data: prefsData } = useQuery({
    queryKey: ["preferences"],
    queryFn: () => api.getPreferences(token!),
    enabled: !!token,
  });

  const prefs = prefsData as UserPreferences | undefined;

  // Request notification permission on mount if user has enabled notifications
  useEffect(() => {
    if (prefs?.notificationsEnabled) {
      requestNotificationPermission().catch(() => {});
    }
  }, [prefs?.notificationsEnabled]);

  const nav = [
    { href: "/dashboard", label: "Feed", icon: Bell },
    { href: "/dashboard/map", label: "Map", icon: Map },
    { href: "/dashboard/settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col">
      {/* Top nav */}
      <header className="border-b border-gray-800 bg-[#0a0a0f]/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="font-bold text-white text-lg tracking-tight">⚔️ WAR INTEL</Link>
            <nav className="hidden sm:flex items-center gap-1">
              {nav.map(n => (
                <Link
                  key={n.href}
                  href={n.href}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition",
                    pathname === n.href
                      ? "bg-blue-600/20 text-blue-400"
                      : "text-gray-400 hover:text-white hover:bg-gray-800"
                  )}
                >
                  <n.icon className="w-4 h-4" />
                  {n.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            {(session?.user as any)?.tier === "pro" && (
              <Link href="/pro" className="flex items-center gap-1 text-xs px-2.5 py-1 bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded-full hover:bg-yellow-500/30 transition">
                <Zap className="w-3 h-3" /> PRO
              </Link>
            )}
            <span className="text-sm text-gray-400 hidden sm:block">{session?.user?.email}</span>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="p-1.5 text-gray-500 hover:text-white transition"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile nav */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 border-t border-gray-800 bg-[#0a0a0f] z-50 flex">
        {nav.map(n => (
          <Link
            key={n.href}
            href={n.href}
            className={cn(
              "flex-1 flex flex-col items-center py-3 gap-1 text-xs transition",
              pathname === n.href ? "text-blue-400" : "text-gray-500"
            )}
          >
            <n.icon className="w-5 h-5" />
            {n.label}
          </Link>
        ))}
      </nav>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 pb-20 sm:pb-8 pt-4">
        {children}
      </main>
    </div>
  );
}
