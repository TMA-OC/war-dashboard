"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { UserPreferences } from "@/types";
import { Download, Save } from "lucide-react";

const ALL_TOPICS = ["Airstrikes", "Missile launches", "Ceasefire", "Sanctions", "Nuclear", "Ground ops", "Casualties", "Diplomatic", "Navy", "Cyber", "Humanitarian"];

export default function ProSettingsPage() {
  const { data: session } = useSession();
  const token = (session as any)?.accessToken as string | undefined;

  const { data: prefsData } = useQuery({
    queryKey: ["preferences"],
    queryFn: () => api.getPreferences(token!),
    enabled: !!token,
  });

  const prefs = prefsData as UserPreferences | undefined;

  const [topics, setTopics] = useState<string[]>([]);
  const [orgName, setOrgName] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#3b82f6");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (prefs) {
      setTopics(prefs.topics || []);
      setOrgName(prefs.brandingOrgName || "");
      setPrimaryColor(prefs.brandingColor || "#3b82f6");
    }
  }, [prefs]);

  const updateMutation = useMutation({
    mutationFn: (data: Partial<UserPreferences>) => api.updatePreferences(data, token!),
    onSuccess: () => { setSaved(true); setTimeout(() => setSaved(false), 2000); },
  });

  const toggleTopic = (t: string) => {
    setTopics(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  };

  const handleExport = async (format: "json" | "csv") => {
    try {
      const data = await api.getAlerts({ limit: 1000 }, token);
      const alerts = (data as any)?.alerts || [];
      if (format === "json") {
        const blob = new Blob([JSON.stringify(alerts, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = "war-dashboard-alerts.json"; a.click();
      } else {
        const headers = ["id", "headline", "countryCode", "confidenceScore", "confidenceLabel", "publishedAt", "url"];
        const rows = alerts.map((a: any) => headers.map(h => JSON.stringify(a[h] ?? "")).join(","));
        const csv = [headers.join(","), ...rows].join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = "war-dashboard-alerts.csv"; a.click();
      }
    } catch {
      alert("Export failed");
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <h1 className="text-xl font-bold text-white">Pro Settings</h1>

      {/* Topic tags */}
      <section className="bg-[#12121a] border border-gray-800 rounded-xl p-5">
        <h2 className="font-semibold text-white mb-3">Topic Tags</h2>
        <p className="text-xs text-gray-400 mb-3">Select which topics to monitor in your Pro feed.</p>
        <div className="flex flex-wrap gap-2">
          {ALL_TOPICS.map(t => (
            <button
              key={t}
              onClick={() => toggleTopic(t)}
              className={`text-sm px-3 py-1.5 rounded-full border transition ${
                topics.includes(t) ? "bg-yellow-500/20 border-yellow-500/50 text-yellow-300" : "border-gray-700 text-gray-400 hover:border-gray-500"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </section>

      {/* Branding */}
      <section className="bg-[#12121a] border border-gray-800 rounded-xl p-5 space-y-4">
        <h2 className="font-semibold text-white">Branding</h2>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Organization Name</label>
          <input
            type="text"
            value={orgName}
            onChange={e => setOrgName(e.target.value)}
            className="w-full px-3 py-2 bg-[#1a1a28] border border-gray-700 rounded-lg text-sm text-white"
            placeholder="Your Org Name"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Primary Color</label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={primaryColor}
              onChange={e => setPrimaryColor(e.target.value)}
              className="w-10 h-10 rounded cursor-pointer bg-transparent border border-gray-700"
            />
            <span className="text-sm text-gray-400 font-mono">{primaryColor}</span>
          </div>
        </div>
      </section>

      {/* Save */}
      <button
        onClick={() => updateMutation.mutate({ topics, brandingOrgName: orgName, brandingColor: primaryColor })}
        disabled={updateMutation.isPending}
        className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition text-sm font-medium"
      >
        <Save className="w-4 h-4" />
        {saved ? "Saved!" : "Save Settings"}
      </button>

      {/* Data export */}
      <section className="bg-[#12121a] border border-gray-800 rounded-xl p-5">
        <h2 className="font-semibold text-white mb-3">Data Export</h2>
        <div className="flex gap-3">
          <button
            onClick={() => handleExport("json")}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm transition"
          >
            <Download className="w-4 h-4" /> Export JSON
          </button>
          <button
            onClick={() => handleExport("csv")}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm transition"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </section>
    </div>
  );
}
