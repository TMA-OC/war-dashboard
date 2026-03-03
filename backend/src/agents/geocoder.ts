/**
 * Geocoding Pipeline
 *
 * Multi-layer geocoding:
 *  1. Local static lookup (GEO_LOOKUP) — instant, covers all major ME conflict zones
 *  2. Nominatim (free, no key) — external fallback
 *  3. Mapbox (MAPBOX_ACCESS_TOKEN) — secondary fallback
 *
 * Results are cached in Redis/KV with key `geo:<normalised_location>` / TTL 7 days.
 * Hit-rate and failure stats are logged on every geocode call.
 */

import { GEO_LOOKUP, type GeoLocation } from "./rssAggregator";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GeocodeResult extends GeoLocation {
  source: "static" | "nominatim" | "mapbox" | "cache";
}

export interface GeocoderEnv {
  KV?: KVNamespace;
  MAPBOX_ACCESS_TOKEN?: string;
  _fetch?: typeof fetch;
}

// ─── KV type shims (for Node / test environments) ─────────────────────────────

export interface KVNamespace {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, opts?: { expirationTtl?: number }): Promise<void>;
  delete(key: string): Promise<void>;
  list(opts?: unknown): Promise<{ keys: Array<{ name: string }>; list_complete: boolean; cursor: string }>;
  getWithMetadata<M = unknown>(key: string): Promise<{ value: string | null; metadata: M | null }>;
}

// ─── In-memory KV shim ────────────────────────────────────────────────────────

export class InMemoryKV implements KVNamespace {
  private store = new Map<string, { value: string; expiry?: number }>();

  async get(key: string): Promise<string | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (entry.expiry && Date.now() > entry.expiry) { this.store.delete(key); return null; }
    return entry.value;
  }
  async put(key: string, value: string, opts?: { expirationTtl?: number }): Promise<void> {
    const expiry = opts?.expirationTtl ? Date.now() + opts.expirationTtl * 1000 : undefined;
    this.store.set(key, { value, expiry });
  }
  async delete(key: string): Promise<void> { this.store.delete(key); }
  async list(): Promise<{ keys: Array<{ name: string }>; list_complete: boolean; cursor: string }> {
    return { keys: [], list_complete: true, cursor: "" };
  }
  async getWithMetadata<M = unknown>(key: string): Promise<{ value: string | null; metadata: M | null }> {
    return { value: await this.get(key), metadata: null };
  }
}

// ─── Redis/KV helpers ─────────────────────────────────────────────────────────

const TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

async function cacheGet(kv: KVNamespace | undefined, key: string): Promise<GeocodeResult | null> {
  if (!kv) return null;
  try {
    const raw = await kv.get(key);
    if (!raw) return null;
    return JSON.parse(raw) as GeocodeResult;
  } catch { return null; }
}

async function cacheSet(kv: KVNamespace | undefined, key: string, value: GeocodeResult): Promise<void> {
  if (!kv) return;
  try { await kv.put(key, JSON.stringify(value), { expirationTtl: TTL_SECONDS }); } catch { /* non-fatal */ }
}

// ─── ME entity aliases ────────────────────────────────────────────────────────

export const ME_ENTITY_ALIASES: Record<string, string> = {
  // Gaza Strip
  "gaza strip": "gaza",
  "northern gaza": "gaza",
  "southern gaza": "rafah",
  "khan yunis": "khan younis",
  "khan yunnis": "khan younis",
  // West Bank
  "the west bank": "west bank",
  // Golan
  "golan heights": "golan heights",
  "the golan": "golan heights",
  // South Lebanon
  "southern lebanon": "south lebanon",
  "south of lebanon": "south lebanon",
  // Hezbollah / IRGC
  "hezbollah": "beirut",
  "hizballah": "beirut",
  "hizb allah": "beirut",
  "irgc": "tehran",
  "islamic revolutionary guard corps": "tehran",
  "quds force": "tehran",
  "al-quds force": "tehran",
  // Hamas / Islamic Jihad
  "hamas": "gaza",
  "islamic jihad": "gaza",
  "pij": "gaza",
  // Houthis
  "houthis": "sanaa",
  "houthi": "sanaa",
  "ansar allah": "sanaa",
  // Common aliases
  "tel-aviv": "tel aviv",
  "tel-aviv-jaffa": "tel aviv",
  "jaffa": "tel aviv",
  "al-quds": "jerusalem",
  "east jerusalem": "jerusalem",
  "west jerusalem": "jerusalem",
};

// Extended lookup — augments GEO_LOOKUP with any missing entries
export const EXTENDED_GEO_LOOKUP: Record<string, GeoLocation> = {
  ...GEO_LOOKUP,
  "golan heights": { name: "Golan Heights", lat: 33.0, lng: 35.75, countryCode: "SY" },
  "khan younis": (GEO_LOOKUP as Record<string, GeoLocation>)["khan younis"]
    ?? { name: "Khan Younis", lat: 31.3452, lng: 34.3064, countryCode: "PS" },
  "south lebanon": (GEO_LOOKUP as Record<string, GeoLocation>)["south lebanon"]
    ?? (GEO_LOOKUP as Record<string, GeoLocation>)["southern lebanon"]
    ?? { name: "South Lebanon", lat: 33.272, lng: 35.2033, countryCode: "LB" },
};

// ─── Location extractor ───────────────────────────────────────────────────────

const SKIP_WORDS = new Set([
  "the", "a", "an", "in", "on", "at", "of", "for", "and", "or", "but",
  "mr", "ms", "dr", "gen", "col", "maj", "capt", "lt", "sgt",
  "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday",
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december",
  "breaking", "exclusive", "updated", "report", "sources", "officials",
  "united", "states", "nations", "security", "council",
]);

/**
 * Extract candidate location strings from article text.
 * Returns deduplicated list, static-lookup hits first.
 */
export function extractLocations(text: string): string[] {
  const lower = text.toLowerCase();
  const found: Set<string> = new Set();

  // 1. Alias matching (longest first)
  const aliasKeys = Object.keys(ME_ENTITY_ALIASES).sort((a, b) => b.length - a.length);
  for (const alias of aliasKeys) {
    if (lower.includes(alias)) {
      found.add(ME_ENTITY_ALIASES[alias]!);
    }
  }

  // 2. Static geo lookup keys (longest first)
  const geoKeys = Object.keys(EXTENDED_GEO_LOOKUP).sort((a, b) => b.length - a.length);
  for (const key of geoKeys) {
    if (lower.includes(key)) found.add(key);
  }

  // 3. Title-Case NLP heuristic — only adds if there's a static match
  const titleCaseRegex = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})\b/g;
  let m: RegExpExecArray | null;
  while ((m = titleCaseRegex.exec(text)) !== null) {
    const candidate = m[1]!.toLowerCase();
    const words = candidate.split(/\s+/);
    if (words.every((w) => !SKIP_WORDS.has(w)) && candidate.length > 2) {
      if (EXTENDED_GEO_LOOKUP[candidate]) found.add(candidate);
    }
  }

  return Array.from(found);
}

// ─── Stats ────────────────────────────────────────────────────────────────────

let _stats = { total: 0, hits: { static: 0, cache: 0, nominatim: 0, mapbox: 0 }, failures: 0 };

export function getGeocodingStats() {
  const totalHits = Object.values(_stats.hits).reduce((a, b) => a + b, 0);
  return { ..._stats, hitRate: _stats.total === 0 ? 0 : (totalHits / _stats.total) * 100 };
}

export function resetGeocodingStats() {
  _stats = { total: 0, hits: { static: 0, cache: 0, nominatim: 0, mapbox: 0 }, failures: 0 };
}

function logStats(source: GeocodeResult["source"] | "miss", location: string) {
  _stats.total++;
  if (source === "miss") {
    _stats.failures++;
    console.warn(`[geocoder] MISS: "${location}"`);
  } else {
    _stats.hits[source]++;
    if (source !== "static") console.log(`[geocoder] HIT via ${source}: "${location}"`);
  }
  if (_stats.total % 100 === 0) {
    const s = getGeocodingStats();
    console.log(`[geocoder] Stats — total:${s.total} hitRate:${s.hitRate.toFixed(1)}% failures:${s.failures}` +
      ` (static:${s.hits.static} cache:${s.hits.cache} nominatim:${s.hits.nominatim} mapbox:${s.hits.mapbox})`);
  }
}

// ─── Nominatim ────────────────────────────────────────────────────────────────

async function geocodeNominatim(
  location: string,
  fetchFn: typeof fetch
): Promise<Omit<GeocodeResult, "source"> | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json&limit=1&addressdetails=1`;
    const res = await fetchFn(url, {
      headers: { "User-Agent": "WarDashboard/1.0 (geocoding-pipeline)" },
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as Array<{
      lat: string; lon: string; display_name: string;
      address?: { country_code?: string };
    }>;
    if (!data.length || !data[0]) return null;
    const r = data[0];
    return {
      name: location,
      lat: parseFloat(r.lat),
      lng: parseFloat(r.lon),
      countryCode: (r.address?.country_code ?? "XX").toUpperCase(),
    };
  } catch { return null; }
}

// ─── Mapbox ───────────────────────────────────────────────────────────────────

async function geocodeMapbox(
  location: string,
  token: string,
  fetchFn: typeof fetch
): Promise<Omit<GeocodeResult, "source"> | null> {
  try {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(location)}.json?access_token=${token}&limit=1`;
    const res = await fetchFn(url, { signal: AbortSignal.timeout(8_000) });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      features?: Array<{
        center: [number, number]; place_name: string;
        context?: Array<{ id: string; short_code?: string }>;
      }>;
    };
    const feature = data.features?.[0];
    if (!feature) return null;
    const [lng, lat] = feature.center;
    const countryCtx = feature.context?.find((c) => c.id.startsWith("country."));
    const countryCode = (countryCtx?.short_code ?? "XX").toUpperCase().slice(0, 2);
    return { name: location, lat: lat!, lng: lng!, countryCode };
  } catch { return null; }
}

// ─── Main geocoder ────────────────────────────────────────────────────────────

/**
 * Geocode a single location string.
 * Ambiguous locations (aliases like "hezbollah", "gaza strip") are resolved via
 * ME_ENTITY_ALIASES before lookup, so we always prefer known conflict-zone coords.
 */
export async function geocodeLocation(
  location: string,
  env: GeocoderEnv = {}
): Promise<GeocodeResult | null> {
  const normalised = location.toLowerCase().trim();
  const cacheKey = `geo:${normalised}`;
  const fetchFn = env._fetch ?? fetch;

  // Resolve alias
  const canonical = ME_ENTITY_ALIASES[normalised] ?? normalised;

  // 1. Static lookup (highest priority)
  const staticResult = EXTENDED_GEO_LOOKUP[canonical];
  if (staticResult) {
    const result: GeocodeResult = { ...staticResult, source: "static" };
    logStats("static", location);
    await cacheSet(env.KV, cacheKey, result);
    return result;
  }

  // 2. KV/Redis cache
  const cached = await cacheGet(env.KV, cacheKey);
  if (cached) {
    logStats("cache", location);
    return { ...cached, source: "cache" };
  }

  // 3. Nominatim
  const nominatimResult = await geocodeNominatim(canonical, fetchFn);
  if (nominatimResult) {
    const result: GeocodeResult = { ...nominatimResult, source: "nominatim" };
    await cacheSet(env.KV, cacheKey, result);
    logStats("nominatim", location);
    return result;
  }

  // 4. Mapbox fallback
  if (env.MAPBOX_ACCESS_TOKEN) {
    const mapboxResult = await geocodeMapbox(canonical, env.MAPBOX_ACCESS_TOKEN, fetchFn);
    if (mapboxResult) {
      const result: GeocodeResult = { ...mapboxResult, source: "mapbox" };
      await cacheSet(env.KV, cacheKey, result);
      logStats("mapbox", location);
      return result;
    }
  }

  logStats("miss", location);
  return null;
}

/**
 * Extract locations from article text and geocode the best match.
 * Static hits are returned immediately; external APIs are tried in order.
 */
export async function geocodeTextAsync(
  text: string,
  env: GeocoderEnv = {}
): Promise<GeocodeResult | null> {
  const locations = extractLocations(text);

  // Try static-lookup candidates first
  for (const loc of locations) {
    const canonical = ME_ENTITY_ALIASES[loc] ?? loc;
    if (EXTENDED_GEO_LOOKUP[canonical]) {
      return geocodeLocation(loc, env);
    }
  }

  // Try external APIs for remaining candidates
  for (const loc of locations) {
    const result = await geocodeLocation(loc, env);
    if (result) return result;
  }

  return null;
}

/**
 * Attach geo_lat / geo_lng to an alert-like object by geocoding its combined text.
 * Does NOT overwrite existing coordinates.
 */
export async function attachGeoToAlert<
  T extends {
    lat?: number | null;
    lng?: number | null;
    locationName?: string | null;
    countryCode?: string | null;
  }
>(
  alert: T,
  text: string,
  env: GeocoderEnv = {}
): Promise<T & { lat: number | null; lng: number | null }> {
  if (alert.lat != null && alert.lng != null) {
    return alert as T & { lat: number | null; lng: number | null };
  }
  const geo = await geocodeTextAsync(text, env);
  if (geo) {
    return { ...alert, lat: geo.lat, lng: geo.lng, locationName: geo.name, countryCode: geo.countryCode };
  }
  return { ...alert, lat: null, lng: null };
}
