"use client";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import dynamic from "next/dynamic";

const AlertMap = dynamic(() => import("@/components/map/AlertMap").then(m => ({ default: m.AlertMap })), { ssr: false });

export default function MapPage() {
  const { data: session } = useSession();
  const token = (session as any)?.accessToken as string | undefined;

  const { data: alertsData } = useQuery({
    queryKey: ["alerts-map"],
    queryFn: () => api.getAlerts({ limit: 100 }, token),
    enabled: !!token,
  });

  const { data: pinsData } = useQuery({
    queryKey: ["pins"],
    queryFn: () => api.getPins(token!),
    enabled: !!token,
  });

  const alerts = ((alertsData as any)?.alerts || []).filter((a: any) => a.lat && a.lng);
  const pins = (pinsData as any)?.pins || [];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-white">Map View</h1>
        <p className="text-sm text-gray-400">Alert locations and your pinned areas</p>
      </div>
      <div className="bg-[#12121a] border border-gray-800 rounded-xl overflow-hidden">
        <div className="p-3 border-b border-gray-800 flex items-center gap-4 text-xs text-gray-400">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-blue-500 inline-block" /> Your pins</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-orange-500 inline-block" /> Alerts</span>
          <span className="ml-auto">{alerts.length} geo-tagged alerts • {pins.length} pins</span>
        </div>
        <AlertMap alerts={alerts} pins={pins} height="500px" />
      </div>
    </div>
  );
}
