/**
 * geocoder.ts — Nominatim-powered geocoding pipeline
 *
 * Extracts known war-zone location names from article text and resolves them
 * to lat/lng via the Nominatim (OpenStreetMap) API. Results are cached in-
 * memory to avoid hammering the public endpoint.
 *
 * This module is intentionally standalone — it does NOT import from
 * rssAggregator.ts to avoid circular dependencies. rssAggregator.ts calls the
 * static GEO_LOOKUP first and uses geocodeArticle() here as a fallback.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GeoResult {
  lat: number;
  lng: number;
  locationName: string;
}

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
}

// ─── Known war location list ──────────────────────────────────────────────────

export const WAR_LOCATIONS: string[] = [
  // Palestine / Gaza
  "Khan Younis", "Khan Yunis", "Beit Lahiya", "Beit Hanoun",
  "Jabaliya", "Rafah", "Gaza City", "Gaza", "West Bank",
  "Ramallah", "Nablus", "Jenin", "Hebron", "Tulkarm",
  // Lebanon
  "South Lebanon", "Southern Lebanon", "North Lebanon",
  "Beirut", "Tripoli", "Sidon", "Tyre", "Baalbek",
  // Israel
  "Northern Israel", "Tel Aviv", "Jerusalem", "Haifa",
  "Beersheba", "Ashkelon", "Ashdod", "Sderot", "Eilat",
  "Netanya", "Dimona", "Nahariya",
  // Iran
  "Tehran", "Isfahan", "Natanz", "Bushehr", "Shiraz",
  "Tabriz", "Mashhad", "Ahvaz", "Kharg Island",
  // Iraq
  "Baghdad", "Erbil", "Mosul", "Kirkuk", "Basra", "Fallujah", "Tikrit",
  // Syria
  "Damascus", "Aleppo", "Homs", "Hama", "Idlib", "Deir ez-Zor",
  // Yemen
  "Sanaa", "Hodeidah", "Aden", "Marib", "Taiz",
  // Ukraine / Russia
  "Kyiv", "Kharkiv", "Mariupol", "Zaporizhzhia", "Odessa", "Kherson",
  "Moscow", "Donetsk", "Bakhmut",
  // Gulf / broader Middle East
  "Red Sea", "Strait of Hormuz", "Gulf of Oman", "Persian Gulf",
  "Riyadh", "Jeddah", "Abu Dhabi", "Dubai", "Doha",
  "Kuwait City", "Manama", "Muscat", "Amman", "Cairo",
];

// lowercase -> canonical name, sorted longest first
const LOCATION_LOWER_MAP = new Map<string, string>(
  WAR_LOCATIONS.map((loc) => [loc.toLowerCase(), loc]),
);
const SORTED_LOWER_KEYS: string[] = [...LOCATION_LOWER_MAP.keys()].sort(
  (a, b) => b.length - a.length,
);

// ─── In-memory cache ──────────────────────────────────────────────────────────

interface CacheEntry {
  result: GeoResult | null;
  cachedAt: number;
}

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours — coords don't change
const geocodeCache = new Map<string, CacheEntry>();

function getCached(key: string): GeoResult | null | undefined {
  const entry = geocodeCache.get(key);
  if (!entry) return undefined;
  if (Date.now() - entry.cachedAt > CACHE_TTL_MS) {
    geocodeCache.delete(key);
    return undefined;
  }
  return entry.result;
}

function setCache(key: string, result: GeoResult | null): void {
  geocodeCache.set(key, { result, cachedAt: Date.now() });
}

// ─── Location extraction ──────────────────────────────────────────────────────

/**
 * Scan article text and return the first known war-zone location found.
 * Longest names are checked first to avoid substring false-positives
 * (e.g. "Gaza City" before "Gaza").
 */
export function extractLocation(text: string): string | null {
  const lower = text.toLowerCase();
  for (const lowerLoc of SORTED_LOWER_KEYS) {
    if (lower.includes(lowerLoc)) {
      return LOCATION_LOWER_MAP.get(lowerLoc) ?? null;
    }
  }
  return null;
}

// ─── Nominatim API call ───────────────────────────────────────────────────────

async function fetchNominatim(location: string): Promise<GeoResult | null> {
  const url =
    "https://nominatim.openstreetmap.org/search?q=" +
    encodeURIComponent(location) +
    "&format=json&limit=1";
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "war-dashboard/1.0", "Accept-Language": "en" },
      signal: AbortSignal.timeout(5_000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as NominatimResult[];
    const first = data[0];
    if (!first) return null;
    return {
      lat: parseFloat(first.lat),
      lng: parseFloat(first.lon),
      locationName: location,
    };
  } catch {
    return null;
  }
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * Geocode an article using Nominatim.
 *
 * Caller is expected to first try the fast static GEO_LOOKUP in
 * rssAggregator.ts. This function handles the fallback path:
 *  1. Extract a location name from the text
 *  2. Check in-memory cache
 *  3. Query Nominatim (result cached for 24 h)
 *
 * Returns null if no location is found or cannot be resolved.
 */
export async function geocodeArticle(
  title: string,
  description?: string,
): Promise<GeoResult | null> {
  const text = `${title} ${description ?? ""}`;

  const locationName = extractLocation(text);
  if (!locationName) return null;

  const cacheKey = locationName.toLowerCase();

  const cached = getCached(cacheKey);
  if (cached !== undefined) return cached;

  const result = await fetchNominatim(locationName);
  setCache(cacheKey, result);
  return result;
}
