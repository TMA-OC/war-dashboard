"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Pin, UserPreferences } from "@/types";
import { Plus, Trash2, Save } from "lucide-react";

const NATIONALITIES = ["Syrian","Lebanese","Israeli","Palestinian","Iranian","Iraqi","Turkish","Yemeni","Saudi","Egyptian","Jordanian","Ukrainian","Russian","American","British","French","German"];
const RADIUS_OPTIONS = [1, 5, 10, 25, 50];

export default function SettingsPage() {
  const { data: session } = useSession();
  const token = (session as any)?.accessToken as string | undefined;
  const queryClient = useQueryClient();

  const { data: prefsData } = useQuery({
    queryKey: ["preferences"],
    queryFn: () => api.getPreferences(token!),
    enabled: !!token,
  });

  const { data: pinsData, refetch: refetchPins } = useQuery({
    queryKey: ["pins"],
    queryFn: () => api.getPins(token!),
    enabled: !!token,
  });

  const prefs = prefsData as UserPreferences | undefined;
  const pins: Pin[] = (pinsData as any)?.pins || [];

  const [nationalities, setNationalities] = useState<string[]>([]);
  const [notifs, setNotifs] = useState(true);
  const [emailDigest, setEmailDigest] = useState(false);
  const [saved, setSaved] = useState(false);

  // New pin form
  const [pinLabel, setPinLabel] = useState("");
  const [pinLat, setPinLat] = useState("");
  const [pinLng, setPinLng] = useState("");
  const [pinRadius, setPinRadius] = useState(10);

  useEffect(() => {
    if (prefs) {
      setNationalities(prefs.nationalities || []);
      setNotifs(prefs.notificationsEnabled);
      setEmailDigest(prefs.emailDigestEnabled);
    }
  }, [prefs]);

  const updatePrefsMutation = useMutation({
    mutationFn: (data: Partial<UserPreferences>) => api.updatePreferences(data, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["preferences"] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  const createPinMutation = useMutation({
    mutationFn: (data: { label: string; lat: number; lng: number; radiusKm: number }) =>
      api.createPin(data, token!),
    onSuccess: () => {
      refetchPins();
      setPinLabel(""); setPinLat(""); setPinLng("");
    },
  });

  const deletePinMutation = useMutation({
    mutationFn: (id: string) => api.deletePin(id, token!),
    onSuccess: () => refetchPins(),
  });

  const toggleNationality = (n: string) => {
    setNationalities(prev =>
      prev.includes(n) ? prev.filter(x => x !== n) : [...prev, n]
    );
  };

  const handleSave = () => {
    updatePrefsMutation.mutate({ nationalities, notificationsEnabled: notifs, emailDigestEnabled: emailDigest });
  };

  const handleAddPin = () => {
    const lat = parseFloat(pinLat);
    const lng = parseFloat(pinLng);
    if (!pinLabel || isNaN(lat) || isNaN(lng)) return;
    createPinMutation.mutate({ label: pinLabel, lat, lng, radiusKm: pinRadius });
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-xl font-bold text-white">Settings</h1>

      {/* Nationalities */}
      <section className="bg-[#12121a] border border-gray-800 rounded-xl p-5">
        <h2 className="font-semibold text-white mb-3">Your Nationalities</h2>
        <div className="flex flex-wrap gap-2">
          {NATIONALITIES.map(n => (
            <button
              key={n}
              onClick={() => toggleNationality(n)}
              className={`text-sm px-3 py-1.5 rounded-full border transition ${
                nationalities.includes(n)
                  ? "bg-blue-600 border-blue-600 text-white"
                  : "border-gray-700 text-gray-400 hover:border-gray-500"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </section>

      {/* Notifications */}
      <section className="bg-[#12121a] border border-gray-800 rounded-xl p-5 space-y-4">
        <h2 className="font-semibold text-white">Notifications</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-white">Push Notifications</p>
            <p className="text-xs text-gray-400">Get alerted for matching events</p>
          </div>
          <button
            onClick={() => setNotifs(!notifs)}
            className={`relative w-11 h-6 rounded-full transition-colors ${notifs ? "bg-blue-600" : "bg-gray-700"}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${notifs ? "translate-x-5" : ""}`} />
          </button>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-white">Daily Email Digest</p>
            <p className="text-xs text-gray-400">Receive a morning summary</p>
          </div>
          <button
            onClick={() => setEmailDigest(!emailDigest)}
            className={`relative w-11 h-6 rounded-full transition-colors ${emailDigest ? "bg-blue-600" : "bg-gray-700"}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${emailDigest ? "translate-x-5" : ""}`} />
          </button>
        </div>
      </section>

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={updatePrefsMutation.isPending}
        className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition text-sm font-medium"
      >
        <Save className="w-4 h-4" />
        {saved ? "Saved!" : updatePrefsMutation.isPending ? "Saving..." : "Save Settings"}
      </button>

      {/* Pin locations */}
      <section className="bg-[#12121a] border border-gray-800 rounded-xl p-5 space-y-4">
        <h2 className="font-semibold text-white">Pinned Locations</h2>
        <p className="text-xs text-gray-400">Get alerts for events within radius of these locations.</p>

        {/* Add pin */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <input
            className="col-span-2 sm:col-span-1 px-3 py-2 bg-[#1a1a28] border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500"
            placeholder="Label (e.g. Beirut)"
            value={pinLabel}
            onChange={e => setPinLabel(e.target.value)}
          />
          <input
            className="px-3 py-2 bg-[#1a1a28] border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500"
            placeholder="Latitude"
            value={pinLat}
            onChange={e => setPinLat(e.target.value)}
          />
          <input
            className="px-3 py-2 bg-[#1a1a28] border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500"
            placeholder="Longitude"
            value={pinLng}
            onChange={e => setPinLng(e.target.value)}
          />
          <div className="flex gap-2">
            <select
              value={pinRadius}
              onChange={e => setPinRadius(Number(e.target.value))}
              className="flex-1 px-2 py-2 bg-[#1a1a28] border border-gray-700 rounded-lg text-sm text-gray-300"
            >
              {RADIUS_OPTIONS.map(r => <option key={r} value={r}>{r}km</option>)}
            </select>
            <button
              onClick={handleAddPin}
              disabled={createPinMutation.isPending}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Pin list */}
        {pins.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-4">No pins yet. Add your first location above.</p>
        )}
        {pins.map(pin => (
          <div key={pin.id} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
            <div>
              <p className="text-sm font-medium text-white">{pin.label}</p>
              <p className="text-xs text-gray-400">{pin.lat.toFixed(4)}, {pin.lng.toFixed(4)} • {pin.radiusKm}km radius</p>
            </div>
            <button
              onClick={() => deletePinMutation.mutate(pin.id)}
              className="p-1.5 text-gray-500 hover:text-red-400 transition"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </section>
    </div>
  );
}
