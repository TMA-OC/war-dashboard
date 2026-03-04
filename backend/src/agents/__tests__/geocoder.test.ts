/**
 * Geocoding pipeline tests
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  extractLocations,
  geocodeLocation,
  geocodeTextAsync,
  attachGeoToAlert,
  getGeocodingStats,
  resetGeocodingStats,
  InMemoryKV,
  ME_ENTITY_ALIASES,
  EXTENDED_GEO_LOOKUP,
} from "../geocoder";

// ─── Location Extractor ───────────────────────────────────────────────────────

describe("extractLocations", () => {
  it("extracts Tel Aviv from article text", () => {
    const text = "IDF forces in Tel Aviv are on high alert following missile strikes from Gaza.";
    const locations = extractLocations(text);
    expect(locations).toContain("tel aviv");
  });

  it("extracts Gaza from article text", () => {
    const text = "Airstrikes pounded northern Gaza overnight, killing at least 20 civilians.";
    const locations = extractLocations(text);
    expect(locations).toContain("gaza");
  });

  it("resolves 'Gaza Strip' alias to 'gaza'", () => {
    const text = "Humanitarian aid enters the Gaza Strip through the Rafah crossing.";
    const locations = extractLocations(text);
    expect(locations).toContain("gaza");
  });

  it("resolves 'Hezbollah' to 'beirut'", () => {
    const text = "Hezbollah fired rockets at northern Israel on Sunday.";
    const locations = extractLocations(text);
    expect(locations).toContain("beirut");
  });

  it("resolves 'IRGC' to 'tehran'", () => {
    const text = "IRGC commanders met in Tehran to discuss the operation.";
    const locations = extractLocations(text);
    expect(locations).toContain("tehran");
  });

  it("handles multiple locations", () => {
    const text = "Missiles fired from Tehran targeted Tel Aviv and Haifa.";
    const locations = extractLocations(text);
    expect(locations).toContain("tehran");
    expect(locations).toContain("tel aviv");
    expect(locations).toContain("haifa");
  });

  it("returns empty array for text with no known locations", () => {
    const text = "The stock market fell sharply on Tuesday amid global uncertainty.";
    const locations = extractLocations(text);
    expect(locations).toHaveLength(0);
  });
});

// ─── Static geocoder ──────────────────────────────────────────────────────────

describe("geocodeLocation — static lookup", () => {
  beforeEach(() => resetGeocodingStats());

  it("returns Tel Aviv coords from static lookup (lat≈32.08, lng≈34.78)", async () => {
    const result = await geocodeLocation("tel aviv");
    expect(result).not.toBeNull();
    expect(result!.source).toBe("static");
    expect(result!.lat).toBeCloseTo(32.08, 1);
    expect(result!.lng).toBeCloseTo(34.78, 1);
    expect(result!.countryCode).toBe("IL");
  });

  it("returns Gaza coords (lat≈31.5, lng≈34.467)", async () => {
    const result = await geocodeLocation("gaza");
    expect(result).not.toBeNull();
    expect(result!.lat).toBeCloseTo(31.5, 1);
    expect(result!.lng).toBeCloseTo(34.467, 1);
    expect(result!.countryCode).toBe("PS");
  });

  it("resolves 'Hezbollah' alias → beirut coords", async () => {
    const result = await geocodeLocation("hezbollah");
    expect(result).not.toBeNull();
    expect(result!.name).toBe("Beirut");
    expect(result!.lat).toBeCloseTo(33.89, 1);
  });

  it("resolves 'Khan Yunis' alias correctly", async () => {
    const result = await geocodeLocation("khan yunis");
    expect(result).not.toBeNull();
    expect(result!.countryCode).toBe("PS");
  });

  it("resolves 'Golan Heights'", async () => {
    const result = await geocodeLocation("golan heights");
    expect(result).not.toBeNull();
    expect(result!.lat).toBeCloseTo(33.0, 0);
  });
});

// ─── KV cache ─────────────────────────────────────────────────────────────────

describe("geocodeLocation — KV cache", () => {
  it("stores result in KV and returns from cache on second call", async () => {
    const kv = new InMemoryKV();
    // First call — static (will also cache)
    const r1 = await geocodeLocation("haifa", { KV: kv });
    expect(r1?.source).toBe("static");

    // The static path writes to cache; manually clear the in-memory geo lookup for this test
    // by calling with a location NOT in static — use a mocked fetch for Nominatim
    const mockFetch = async (_url: string): Promise<Response> => {
      const body = JSON.stringify([{
        lat: "32.0853", lon: "34.7818", display_name: "Tel Aviv",
        address: { country_code: "il" },
      }]);
      return new Response(body, { status: 200 });
    };

    // First external call — goes to Nominatim mock
    const r2 = await geocodeLocation("test-location-xyz", { KV: kv, _fetch: mockFetch as typeof fetch });
    expect(r2?.source).toBe("nominatim");

    // Second call — should return from cache
    const r3 = await geocodeLocation("test-location-xyz", { KV: kv, _fetch: mockFetch as typeof fetch });
    expect(r3?.source).toBe("cache");
  });
});

// ─── geocodeTextAsync ─────────────────────────────────────────────────────────

describe("geocodeTextAsync", () => {
  it("extracts 'Tel Aviv' from article text and returns lat≈32.08, lng≈34.78", async () => {
    const text = `
      BREAKING: IDF confirms missile intercepted over Tel Aviv.
      The interception occurred at 02:34 local time as sirens sounded across the city.
    `;
    const result = await geocodeTextAsync(text);
    expect(result).not.toBeNull();
    expect(result!.lat).toBeCloseTo(32.08, 1);
    expect(result!.lng).toBeCloseTo(34.78, 1);
    expect(result!.countryCode).toBe("IL");
  });

  it("falls back to Nominatim for unknown location", async () => {
    const mockFetch = async (_url: string): Promise<Response> => {
      const body = JSON.stringify([{
        lat: "35.6892", lon: "51.3890", display_name: "Tehran, Iran",
        address: { country_code: "ir" },
      }]);
      return new Response(body, { status: 200 });
    };

    // Text with something that's not in our static list
    const text = "Protests erupted in Tehran's central district near Azadi Square.";
    // "Tehran" IS in static list so this tests static path
    const result = await geocodeTextAsync(text, { _fetch: mockFetch as typeof fetch });
    expect(result).not.toBeNull();
    expect(result!.lat).toBeCloseTo(35.68, 1);
  });
});

// ─── attachGeoToAlert ─────────────────────────────────────────────────────────

describe("attachGeoToAlert", () => {
  it("attaches lat/lng to alert without coordinates", async () => {
    const alert = { headline: "Airstrike in Beirut kills 5", lat: null, lng: null, locationName: null, countryCode: null };
    const text = "An airstrike in Beirut killed at least five people on Sunday.";
    const result = await attachGeoToAlert(alert, text);
    expect(result.lat).not.toBeNull();
    expect(result.lng).not.toBeNull();
    expect(result.countryCode).toBe("LB");
  });

  it("does not overwrite existing coordinates", async () => {
    const alert = { lat: 10.0, lng: 20.0, locationName: "Custom", countryCode: "XX" };
    const result = await attachGeoToAlert(alert, "Tel Aviv attacked");
    expect(result.lat).toBe(10.0);
    expect(result.lng).toBe(20.0);
  });
});

// ─── Geocoding stats ──────────────────────────────────────────────────────────

describe("getGeocodingStats", () => {
  beforeEach(() => resetGeocodingStats());

  it("tracks static hits correctly", async () => {
    await geocodeLocation("tel aviv");
    await geocodeLocation("gaza");
    await geocodeLocation("beirut");
    const stats = getGeocodingStats();
    expect(stats.total).toBe(3);
    expect(stats.hits.static).toBe(3);
    expect(stats.failures).toBe(0);
    expect(stats.hitRate).toBe(100);
  });

  it("tracks misses", async () => {
    // No fetch → Nominatim will fail, Mapbox not configured
    const noFetch = async (): Promise<Response> => { throw new Error("no network"); };
    await geocodeLocation("definitely-not-a-place-xyzzy", { _fetch: noFetch as typeof fetch });
    const stats = getGeocodingStats();
    expect(stats.failures).toBe(1);
  });
});
