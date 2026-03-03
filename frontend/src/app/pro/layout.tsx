"use client";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";
import { Settings, LogOut, Maximize2, Minimize2, Monitor, Home } from "lucide-react";

export default function ProLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [fullscreen, setFullscreen] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setFullscreen(true);
    } else {
      document.exitFullscreen();
      setFullscreen(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#060609] flex flex-col overflow-x-hidden" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
      {/* PRO Header */}
      <header className="border-b border-gray-800/60 bg-[#060609] h-12 flex items-center justify-between px-2 sm:px-4 shrink-0">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          <Link href="/pro" className="flex items-center gap-1 sm:gap-2 shrink-0">
            <Monitor className="w-4 h-4 text-yellow-400" />
            <span className="font-bold text-white text-sm tracking-wide hidden xs:inline sm:inline">WAR INTEL</span>
            <span className="text-xs px-1.5 py-0.5 bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded font-bold">PRO</span>
          </Link>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <Link href="/dashboard" className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 transition px-2 py-1">
            <Home className="w-3.5 h-3.5 sm:hidden" />
            <span className="hidden sm:inline">Individual</span>
          </Link>
          <Link
            href="/pro/settings"
            className="p-1.5 text-gray-500 hover:text-white transition"
          >
            <Settings className="w-4 h-4" />
          </Link>
          <button
            onClick={toggleFullscreen}
            className="p-1.5 text-gray-500 hover:text-white transition hidden sm:block"
            title="Toggle fullscreen / TV mode"
          >
            {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="p-1.5 text-gray-500 hover:text-white transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>
      <main className="flex-1 overflow-hidden">
        {children}
      </main>
    </div>
  );
}
