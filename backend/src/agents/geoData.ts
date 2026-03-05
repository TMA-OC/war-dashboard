/**
 * Shared geo data — extracted to break circular dependency between
 * rssAggregator.ts and geocoder.ts
 */

export interface GeoLocation {
  name: string;
  lat: number;
  lng: number;
  countryCode: string;
}

export const GEO_LOOKUP: Record<string, GeoLocation> = {
  "tel aviv": { name: "Tel Aviv", lat: 32.0853, lng: 34.7818, countryCode: "IL" },
  "jerusalem": { name: "Jerusalem", lat: 31.7683, lng: 35.2137, countryCode: "IL" },
  "haifa": { name: "Haifa", lat: 32.7940, lng: 34.9896, countryCode: "IL" },
  "beersheba": { name: "Beersheba", lat: 31.2516, lng: 34.7913, countryCode: "IL" },
  "gaza": { name: "Gaza", lat: 31.5017, lng: 34.4668, countryCode: "PS" },
  "rafah": { name: "Rafah", lat: 31.2805, lng: 34.2506, countryCode: "PS" },
  "khan younis": { name: "Khan Younis", lat: 31.3452, lng: 34.3064, countryCode: "PS" },
  "beirut": { name: "Beirut", lat: 33.8938, lng: 35.5018, countryCode: "LB" },
  "south lebanon": { name: "South Lebanon", lat: 33.2720, lng: 35.2033, countryCode: "LB" },
  "tyre": { name: "Tyre", lat: 33.2705, lng: 35.2038, countryCode: "LB" },
  "tehran": { name: "Tehran", lat: 35.6892, lng: 51.3890, countryCode: "IR" },
  "isfahan": { name: "Isfahan", lat: 32.6546, lng: 51.6680, countryCode: "IR" },
  "natanz": { name: "Natanz", lat: 33.7234, lng: 51.7266, countryCode: "IR" },
  "baghdad": { name: "Baghdad", lat: 33.3152, lng: 44.3661, countryCode: "IQ" },
  "erbil": { name: "Erbil", lat: 36.1901, lng: 44.0091, countryCode: "IQ" },
  "mosul": { name: "Mosul", lat: 36.3400, lng: 43.1300, countryCode: "IQ" },
  "damascus": { name: "Damascus", lat: 33.5138, lng: 36.2765, countryCode: "SY" },
  "aleppo": { name: "Aleppo", lat: 36.2021, lng: 37.1343, countryCode: "SY" },
  "sanaa": { name: "Sanaa", lat: 15.3694, lng: 44.1910, countryCode: "YE" },
  "hodeidah": { name: "Hodeidah", lat: 14.7978, lng: 42.9541, countryCode: "YE" },
  "riyadh": { name: "Riyadh", lat: 24.7136, lng: 46.6753, countryCode: "SA" },
  "jeddah": { name: "Jeddah", lat: 21.3891, lng: 39.8579, countryCode: "SA" },
  "amman": { name: "Amman", lat: 31.9539, lng: 35.9106, countryCode: "JO" },
  "cairo": { name: "Cairo", lat: 30.0444, lng: 31.2357, countryCode: "EG" },
  "red sea": { name: "Red Sea", lat: 20.0, lng: 38.0, countryCode: "XX" },
  "strait of hormuz": { name: "Strait of Hormuz", lat: 26.5553, lng: 56.2500, countryCode: "XX" },
  "northern israel": { name: "Northern Israel", lat: 32.9, lng: 35.2, countryCode: "IL" },
  "southern lebanon": { name: "Southern Lebanon", lat: 33.2, lng: 35.5, countryCode: "LB" },
  "west bank": { name: "West Bank", lat: 31.9, lng: 35.2, countryCode: "PS" },
  "ramallah": { name: "Ramallah", lat: 31.9, lng: 35.2, countryCode: "PS" },
  "jenin": { name: "Jenin", lat: 32.46, lng: 35.30, countryCode: "PS" },
  "nablus": { name: "Nablus", lat: 32.22, lng: 35.26, countryCode: "PS" },
  "hebron": { name: "Hebron", lat: 31.53, lng: 35.10, countryCode: "PS" },
  "sidon": { name: "Sidon", lat: 33.56, lng: 35.37, countryCode: "LB" },
  "tripoli": { name: "Tripoli", lat: 34.44, lng: 35.83, countryCode: "LB" },
  "eilat": { name: "Eilat", lat: 29.56, lng: 34.95, countryCode: "IL" },
  "dimona": { name: "Dimona", lat: 31.07, lng: 35.03, countryCode: "IL" },
  "sderot": { name: "Sderot", lat: 31.52, lng: 34.60, countryCode: "IL" },
  "ashkelon": { name: "Ashkelon", lat: 31.67, lng: 34.57, countryCode: "IL" },
  "ashdod": { name: "Ashdod", lat: 31.80, lng: 34.65, countryCode: "IL" },
  "netanya": { name: "Netanya", lat: 32.33, lng: 34.86, countryCode: "IL" },
  "aden": { name: "Aden", lat: 12.78, lng: 45.04, countryCode: "YE" },
  "marib": { name: "Marib", lat: 15.46, lng: 45.32, countryCode: "YE" },
  "tabriz": { name: "Tabriz", lat: 38.08, lng: 46.30, countryCode: "IR" },
  "shiraz": { name: "Shiraz", lat: 29.59, lng: 52.58, countryCode: "IR" },
  "bushehr": { name: "Bushehr", lat: 28.92, lng: 50.82, countryCode: "IR" },
  "kharg island": { name: "Kharg Island", lat: 29.24, lng: 50.32, countryCode: "IR" },
  "abu dhabi": { name: "Abu Dhabi", lat: 24.47, lng: 54.37, countryCode: "AE" },
  "muscat": { name: "Muscat", lat: 23.61, lng: 58.59, countryCode: "OM" },
  "manama": { name: "Manama", lat: 26.22, lng: 50.57, countryCode: "BH" },
  "doha": { name: "Doha", lat: 25.29, lng: 51.53, countryCode: "QA" },
  "kuwait city": { name: "Kuwait City", lat: 29.37, lng: 47.98, countryCode: "KW" },
};

export function geocodeText(text: string): GeoLocation | null {
  const lower = text.toLowerCase();
  const sortedKeys = Object.keys(GEO_LOOKUP).sort((a, b) => b.length - a.length);
  for (const key of sortedKeys) {
    if (lower.includes(key)) {
      return GEO_LOOKUP[key] ?? null;
    }
  }
  return null;
}
