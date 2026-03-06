export interface Alert {
  id: string
  headline: string
  summary: string
  content?: string
  category: string
  is_breaking: boolean
  confidence_label: 'VERIFIED' | 'LIKELY' | 'UNVERIFIED' | 'RUMOR'
  confidence_score: number
  location?: string
  lat?: number
  lng?: number
  sources: Source[]
  created_at: string
  read?: boolean
}

export interface Source {
  name: string
  url: string
  favicon?: string
}

export interface Strike {
  id: string
  location: string
  type: string
  lat: number
  lng: number
  created_at: string
  confidence_score: number
  reports?: Alert[]
}

export interface Pin {
  id: string
  label: string
  lat: number
  lng: number
  radius: number
}

export interface UserPreferences {
  nationality: string[]
  pins: Pin[]
  topic_tags: string[]
  notifications_enabled: boolean
  branding?: {
    logo_url?: string
    primary_color?: string
    display_name?: string
  }
  source_filters?: Record<string, boolean>
}

export interface User {
  id: string
  name?: string
  displayName?: string
  email: string
  tier: 'individual' | 'pro'
  avatarUrl?: string | null
  createdAt?: string
}

export interface Casualties {
  killed_24h: number
  wounded_24h: number
  updated_at: string
  by_country?: Record<string, { killed: number; wounded: number }>
}
