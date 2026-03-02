export interface Alert {
  id: string;
  headline: string;
  summary?: string;
  url: string;
  imageUrl?: string;
  lat?: number;
  lng?: number;
  locationName?: string;
  countryCode?: string;
  category?: string;
  topics: string[];
  keywords: string[];
  confidenceScore: number;
  confidenceLabel: string;
  isBreaking: boolean;
  publishedAt: string;
  createdAt: string;
  source?: {
    id: string;
    name: string;
    logoUrl?: string;
    slug: string;
  };
}

export interface Strike {
  id: string;
  lat: number;
  lng: number;
  locationName?: string;
  countryCode?: string;
  strikeType?: string;
  casualties?: number;
  confidenceScore: number;
  publishedAt: string;
  createdAt: string;
}

export interface Pin {
  id: string;
  label: string;
  lat: number;
  lng: number;
  radiusKm: number;
  countryCode?: string;
  isActive: boolean;
  createdAt: string;
}

export interface UserPreferences {
  id: string;
  userId: string;
  nationalities: string[];
  watchedCountries: string[];
  topics: string[];
  brandingLogoUrl?: string;
  brandingColor?: string;
  brandingOrgName?: string;
  notificationsEnabled: boolean;
  emailDigestEnabled: boolean;
}

export interface User {
  id: string;
  email: string;
  displayName?: string;
  avatarUrl?: string;
  tier: "individual" | "pro";
}
