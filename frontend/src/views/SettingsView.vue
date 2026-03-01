<template>
  <div class="flex flex-col h-screen">
    <AppHeader />
    <div class="flex-1 overflow-y-auto p-6 max-w-3xl mx-auto w-full">
      <h1 class="text-2xl font-bold text-white mb-6">Settings</h1>

      <div v-if="saved" class="mb-4 bg-green-950/40 border border-war-green/40 text-war-green rounded-lg px-4 py-2 text-sm">
        Settings saved successfully
      </div>

      <!-- Nationality -->
      <section class="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-4">
        <h2 class="font-semibold text-white mb-4">Nationality / Monitoring Region</h2>
        <div class="relative">
          <input
            v-model="nationalitySearch"
            type="text"
            placeholder="Search countries..."
            class="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-war-orange"
          />
          <div v-if="nationalitySearch" class="absolute z-20 w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg max-h-48 overflow-y-auto">
            <button
              v-for="c in filteredCountries"
              :key="c.code"
              @click="toggleNationality(c.code)"
              :class="['flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-slate-700 text-left', localPrefs.nationality.includes(c.code) ? 'text-war-orange' : 'text-white']"
            >
              <span>{{ c.flag }}</span>
              <span>{{ c.name }}</span>
              <span v-if="localPrefs.nationality.includes(c.code)" class="ml-auto">✓</span>
            </button>
          </div>
        </div>
        <div class="flex flex-wrap gap-2 mt-3">
          <span
            v-for="code in localPrefs.nationality"
            :key="code"
            class="flex items-center gap-1 bg-slate-800 text-white text-sm px-2 py-1 rounded-full"
          >
            {{ getFlagEmoji(code) }} {{ code }}
            <button @click="toggleNationality(code)" class="text-slate-400 hover:text-war-red ml-1">×</button>
          </span>
        </div>
      </section>

      <!-- Pin Manager -->
      <section class="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-4">
        <h2 class="font-semibold text-white mb-4">Monitored Locations</h2>

        <div class="space-y-3 mb-4">
          <div
            v-for="(pin, i) in localPrefs.pins"
            :key="pin.id"
            class="flex items-center gap-3 bg-slate-800 rounded-lg p-3"
          >
            <span class="text-war-red">📍</span>
            <div class="flex-1 space-y-2">
              <input
                v-model="pin.label"
                type="text"
                class="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-war-orange"
                placeholder="Location label"
              />
              <div class="flex items-center gap-2">
                <span class="text-xs text-slate-400">Radius: {{ pin.radius }}km</span>
                <input v-model.number="pin.radius" type="range" min="1" max="500" class="flex-1 accent-war-orange" />
              </div>
              <p class="text-xs text-slate-500">{{ pin.lat.toFixed(4) }}, {{ pin.lng.toFixed(4) }}</p>
            </div>
            <button @click="removePin(i)" class="text-slate-500 hover:text-war-red transition-colors">🗑</button>
          </div>
        </div>

        <div class="flex gap-2">
          <button @click="addLocationPin" :disabled="locating" class="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-sm text-white px-3 py-2 rounded-lg transition-colors disabled:opacity-50">
            📍 {{ locating ? 'Getting location...' : 'Use My Location' }}
          </button>
        </div>

        <div class="mt-3">
          <div class="flex gap-2">
            <input
              v-model="addressSearch"
              type="text"
              placeholder="Search address..."
              class="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-war-orange"
              @keydown.enter="geocodeAddress"
            />
            <button @click="geocodeAddress" class="bg-war-orange hover:bg-orange-600 text-white text-sm px-3 py-2 rounded-lg transition-colors">Add</button>
          </div>
        </div>
      </section>

      <!-- Topic Tags -->
      <section class="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-4">
        <h2 class="font-semibold text-white mb-4">Topic Tags</h2>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="tag in ALL_TAGS"
            :key="tag"
            @click="toggleTag(tag)"
            :class="['px-3 py-1.5 rounded-full text-sm font-medium transition-all', localPrefs.topic_tags.includes(tag) ? 'bg-war-orange text-white' : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700']"
          >
            {{ tag }}
          </button>
        </div>
      </section>

      <!-- Notifications -->
      <section class="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-6">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="font-semibold text-white">Notifications</h2>
            <p class="text-sm text-slate-400 mt-1">Receive alerts for breaking news in your monitored areas</p>
          </div>
          <button
            @click="localPrefs.notifications_enabled = !localPrefs.notifications_enabled"
            :class="['relative w-12 h-6 rounded-full transition-colors', localPrefs.notifications_enabled ? 'bg-war-green' : 'bg-slate-700']"
          >
            <span :class="['absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform', localPrefs.notifications_enabled ? 'translate-x-6' : 'translate-x-0.5']"></span>
          </button>
        </div>
      </section>

      <button @click="saveSettings" :disabled="saving" class="w-full bg-war-orange hover:bg-orange-600 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors">
        {{ saving ? 'Saving...' : 'Save Settings' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useGeolocation } from '@vueuse/core'
import AppHeader from '@/components/layout/AppHeader.vue'
import { usePreferencesStore } from '@/stores/preferences'
import type { Pin } from '@/types'

const prefsStore = usePreferencesStore()
await prefsStore.fetch()

const localPrefs = reactive({
  nationality: [...prefsStore.prefs.nationality],
  pins: prefsStore.prefs.pins.map(p => ({ ...p })),
  topic_tags: [...prefsStore.prefs.topic_tags],
  notifications_enabled: prefsStore.prefs.notifications_enabled,
})

const nationalitySearch = ref('')
const addressSearch = ref('')
const saving = ref(false)
const saved = ref(false)
const locating = ref(false)

const ALL_TAGS = ['Airstrikes', 'Naval', 'Missiles', 'Ceasefire', 'Sanctions', 'Nuclear', 'Hostages', 'Refugees', 'Diplomatic', 'UN Security Council', 'Hezbollah', 'Houthis', 'Hamas', 'US Military', 'IDF', 'IRGC', 'Mossad', 'Oil/Energy', 'Red Sea', 'Cyber']

const COUNTRIES = [
  { code: 'US', name: 'United States', flag: '🇺🇸' }, { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'IL', name: 'Israel', flag: '🇮🇱' }, { code: 'IR', name: 'Iran', flag: '🇮🇷' },
  { code: 'LB', name: 'Lebanon', flag: '🇱🇧' }, { code: 'PS', name: 'Palestine', flag: '🇵🇸' },
  { code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦' }, { code: 'AE', name: 'UAE', flag: '🇦🇪' },
  { code: 'RU', name: 'Russia', flag: '🇷🇺' }, { code: 'UA', name: 'Ukraine', flag: '🇺🇦' },
  { code: 'CN', name: 'China', flag: '🇨🇳' }, { code: 'SY', name: 'Syria', flag: '🇸🇾' },
  { code: 'YE', name: 'Yemen', flag: '🇾🇪' }, { code: 'IQ', name: 'Iraq', flag: '🇮🇶' },
  { code: 'TR', name: 'Turkey', flag: '🇹🇷' }, { code: 'EG', name: 'Egypt', flag: '🇪🇬' },
  { code: 'JO', name: 'Jordan', flag: '🇯🇴' },
]

const filteredCountries = computed(() =>
  COUNTRIES.filter(c => c.name.toLowerCase().includes(nationalitySearch.value.toLowerCase()))
)

function getFlagEmoji(code: string) {
  return COUNTRIES.find(c => c.code === code)?.flag || '🌍'
}

function toggleNationality(code: string) {
  const idx = localPrefs.nationality.indexOf(code)
  if (idx >= 0) localPrefs.nationality.splice(idx, 1)
  else localPrefs.nationality.push(code)
}

function toggleTag(tag: string) {
  const idx = localPrefs.topic_tags.indexOf(tag)
  if (idx >= 0) localPrefs.topic_tags.splice(idx, 1)
  else localPrefs.topic_tags.push(tag)
}

function removePin(i: number) {
  localPrefs.pins.splice(i, 1)
}

function addPin(lat: number, lng: number, label = 'My Location') {
  localPrefs.pins.push({ id: crypto.randomUUID(), label, lat, lng, radius: 50 })
}

async function addLocationPin() {
  locating.value = true
  try {
    const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
      navigator.geolocation.getCurrentPosition(resolve, reject)
    )
    addPin(pos.coords.latitude, pos.coords.longitude, 'My Location')
  } catch {
    alert('Could not get your location')
  } finally {
    locating.value = false
  }
}

const loadGoogleMaps = (): Promise<void> => {
  if ((window as any).google) return Promise.resolve()
  return new Promise((resolve) => {
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_KEY}&libraries=places`
    script.onload = resolve as any
    document.head.appendChild(script)
  })
}

async function geocodeAddress() {
  if (!addressSearch.value.trim()) return
  const key = import.meta.env.VITE_GOOGLE_MAPS_KEY
  if (!key) {
    // fallback: use nominatim
    const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(addressSearch.value)}&format=json&limit=1`)
    const data = await res.json()
    if (data[0]) {
      addPin(parseFloat(data[0].lat), parseFloat(data[0].lon), addressSearch.value)
      addressSearch.value = ''
    }
    return
  }
  const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(addressSearch.value)}&key=${key}`)
  const data = await res.json()
  if (data.results?.[0]) {
    const loc = data.results[0].geometry.location
    addPin(loc.lat, loc.lng, addressSearch.value)
    addressSearch.value = ''
  }
}

async function saveSettings() {
  saving.value = true
  try {
    await prefsStore.save(localPrefs)
    saved.value = true
    setTimeout(() => { saved.value = false }, 3000)
  } finally {
    saving.value = false
  }
}
</script>
