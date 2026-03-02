const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://war-dashboard-api.the-models-aigency.workers.dev";

async function apiFetch<T>(path: string, options?: RequestInit, token?: string): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options?.headers as Record<string, string> || {}),
  };
  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.text().catch(() => "Unknown error");
    throw new Error(`API ${path}: ${res.status} ${err}`);
  }
  return res.json();
}

export const api = {
  // Auth
  register: (data: { email: string; password: string; displayName?: string }) =>
    apiFetch<{ token: string; user: unknown }>("/auth/register", { method: "POST", body: JSON.stringify(data) }),

  login: (data: { email: string; password: string }) =>
    apiFetch<{ token: string; user: unknown }>("/auth/login", { method: "POST", body: JSON.stringify(data) }),

  // Alerts
  getAlerts: (params: { limit?: number; offset?: number; country?: string; minConfidence?: number } = {}, token?: string) => {
    const q = new URLSearchParams();
    if (params.limit) q.set("limit", String(params.limit));
    if (params.offset) q.set("offset", String(params.offset));
    if (params.country) q.set("country", params.country);
    if (params.minConfidence) q.set("minConfidence", String(params.minConfidence));
    return apiFetch<{ alerts: unknown[]; total: number }>(`/alerts?${q}`, {}, token);
  },

  getStrikes: (token?: string) =>
    apiFetch<{ strikes: unknown[] }>("/alerts/strikes", {}, token),

  // Preferences
  getPreferences: (token: string) =>
    apiFetch<unknown>("/preferences", {}, token),

  updatePreferences: (data: unknown, token: string) =>
    apiFetch<unknown>("/preferences", { method: "PUT", body: JSON.stringify(data) }, token),

  // Pins
  getPins: (token: string) =>
    apiFetch<{ pins: unknown[] }>("/pins", {}, token),

  createPin: (data: { label: string; lat: number; lng: number; radiusKm: number }, token: string) =>
    apiFetch<unknown>("/pins", { method: "POST", body: JSON.stringify(data) }, token),

  deletePin: (id: string, token: string) =>
    apiFetch<unknown>(`/pins/${id}`, { method: "DELETE" }, token),
};

export { API_URL };
