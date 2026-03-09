<template>
  <div class="flex flex-col h-screen">
    <AppHeader />
    <div class="flex-1 overflow-y-auto p-6 max-w-4xl mx-auto w-full">
      <h1 class="text-2xl font-bold text-white mb-6">Pro Settings</h1>

      <div v-if="saved" class="mb-4 bg-green-950/40 border border-war-green/40 text-war-green rounded-lg px-4 py-2 text-sm">
        Settings saved successfully
      </div>

      <!-- Branding Section -->
      <section class="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-4">
        <h2 class="font-semibold text-white mb-4">Broadcast Branding</h2>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="space-y-4">
            <!-- Logo upload -->
            <div>
              <label class="block text-sm text-slate-400 mb-2">Organization Logo</label>
              <div
                @dragover.prevent="dragging = true"
                @dragleave="dragging = false"
                @drop.prevent="handleDrop"
                :class="['border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors', dragging ? 'border-war-orange bg-orange-950/20' : 'border-slate-700 hover:border-slate-600']"
                @click="logoInput?.click()"
              >
                <img v-if="logoPreview" :src="logoPreview" class="max-h-20 mx-auto mb-2 object-contain" />
                <div v-else>
                  <p class="text-slate-400 text-sm">Drop PNG/SVG/JPG here</p>
                  <p class="text-slate-600 text-xs mt-1">Max 2MB</p>
                </div>
              </div>
              <input ref="logoInput" type="file" accept="image/png,image/svg+xml,image/jpeg" class="hidden" @change="handleFileSelect" />
            </div>

            <!-- Display name -->
            <div>
              <label class="block text-sm text-slate-400 mb-1">Display Name</label>
              <input
                v-model="branding.display_name"
                type="text"
                class="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-war-orange"
                placeholder="Your Organization"
              />
            </div>

            <!-- Color picker -->
            <div>
              <label class="block text-sm text-slate-400 mb-1">Primary Color</label>
              <div class="flex gap-2">
                <input
                  v-model="branding.primary_color"
                  type="color"
                  class="w-10 h-10 bg-slate-800 border border-slate-700 rounded cursor-pointer"
                />
                <input
                  v-model="branding.primary_color"
                  type="text"
                  maxlength="7"
                  class="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-war-orange"
                  placeholder="#ef4444"
                />
              </div>
            </div>
          </div>

          <!-- Live preview -->
          <div>
            <label class="block text-sm text-slate-400 mb-2">Preview</label>
            <div class="rounded-lg overflow-hidden border border-slate-700">
              <div
                class="flex items-center justify-between px-4 py-3"
                :style="{ background: branding.primary_color || '#1e293b' }"
              >
                <img v-if="logoPreview" :src="logoPreview" class="h-8 object-contain" />
                <div v-else class="w-8 h-8 bg-white/20 rounded"></div>
                <span class="font-bold text-white text-lg tracking-widest">WAR DASHBOARD</span>
                <div class="text-right text-xs text-white/80">
                  <p>{{ currentUTC }}</p>
                  <p>{{ branding.display_name || 'Your Org' }}</p>
                </div>
              </div>
              <div class="bg-slate-950 p-3 text-xs text-slate-500 text-center">
                Broadcast header preview
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Topic Tag Manager -->
      <section class="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-4">
        <h2 class="font-semibold text-white mb-4">Topic Tags</h2>
        <div class="flex flex-wrap gap-2 mb-3">
          <button
            v-for="tag in ALL_TAGS"
            :key="tag"
            @click="toggleTag(tag)"
            :class="['px-3 py-1.5 rounded-full text-sm font-medium transition-all', localPrefs.topic_tags.includes(tag) ? 'bg-war-orange text-white' : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700']"
          >
            {{ tag }}
          </button>
        </div>
        <div class="flex gap-2">
          <input v-model="customTag" type="text" placeholder="Add custom tag..." class="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-war-orange" @keydown.enter="addCustomTag" />
          <button @click="addCustomTag" class="bg-slate-700 hover:bg-slate-600 text-white px-3 py-2 rounded-lg text-sm transition-colors">Add</button>
        </div>
      </section>

      <!-- Source Filters -->
      <section class="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-4">
        <h2 class="font-semibold text-white mb-4">RSS Source Filters</h2>
        <div class="space-y-2">
          <div v-for="src in SOURCES" :key="src" class="flex items-center justify-between">
            <span class="text-sm text-white">{{ src }}</span>
            <button
              @click="toggleSource(src)"
              :class="['relative w-10 h-5 rounded-full transition-colors', sourceFilters[src] !== false ? 'bg-war-green' : 'bg-slate-700']"
            >
              <span :class="['absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform', sourceFilters[src] !== false ? 'translate-x-5' : 'translate-x-0.5']"></span>
            </button>
          </div>
        </div>
      </section>

      <button @click="saveSettings" :disabled="saving" class="w-full bg-war-orange hover:bg-orange-600 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors">
        {{ saving ? 'Saving...' : 'Save Settings' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import AppHeader from '@/components/layout/AppHeader.vue'
import { usePreferencesStore } from '@/stores/preferences'

const prefsStore = usePreferencesStore()
onMounted(async () => { await prefsStore.fetch() })

const localPrefs = reactive({
  topic_tags: [...prefsStore.prefs.topic_tags],
})

const branding = reactive({
  display_name: prefsStore.prefs.branding?.display_name || '',
  primary_color: prefsStore.prefs.branding?.primary_color || '#ef4444',
  logo_url: prefsStore.prefs.branding?.logo_url || '',
})

const sourceFilters = reactive<Record<string, boolean>>({ ...(prefsStore.prefs.source_filters || {}) })

const saving = ref(false)
const saved = ref(false)
const dragging = ref(false)
const logoInput = ref<HTMLInputElement>()
const logoPreview = ref(branding.logo_url || '')
const customTag = ref('')

const ALL_TAGS = ['Airstrikes', 'Naval', 'Missiles', 'Ceasefire', 'Sanctions', 'Nuclear', 'Hostages', 'Refugees', 'Diplomatic', 'UN Security Council', 'Hezbollah', 'Houthis', 'Hamas', 'US Military', 'IDF', 'IRGC', 'Mossad', 'Oil/Energy', 'Red Sea', 'Cyber']
const SOURCES = ['Reuters', 'AP News', 'BBC', 'Al Jazeera', 'Times of Israel', 'Haaretz', 'Jerusalem Post', 'Middle East Eye', 'i24 NEWS', 'Channel 12 News', 'Ynet News', 'The Guardian', 'CNN', 'Fox News']

const currentUTC = computed(() => new Date().toUTCString().slice(0, 25))

function toggleTag(tag: string) {
  const idx = localPrefs.topic_tags.indexOf(tag)
  if (idx >= 0) localPrefs.topic_tags.splice(idx, 1)
  else localPrefs.topic_tags.push(tag)
}

function addCustomTag() {
  if (customTag.value.trim() && !localPrefs.topic_tags.includes(customTag.value.trim())) {
    localPrefs.topic_tags.push(customTag.value.trim())
    customTag.value = ''
  }
}

function toggleSource(src: string) {
  sourceFilters[src] = sourceFilters[src] === false ? true : false
}

function handleDrop(e: DragEvent) {
  dragging.value = false
  const file = e.dataTransfer?.files[0]
  if (file) processLogoFile(file)
}

function handleFileSelect(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) processLogoFile(file)
}

function processLogoFile(file: File) {
  if (file.size > 2 * 1024 * 1024) { alert('File too large (max 2MB)'); return }
  const reader = new FileReader()
  reader.onload = (e) => { logoPreview.value = e.target?.result as string }
  reader.readAsDataURL(file)
}

async function saveSettings() {
  saving.value = true
  try {
    await prefsStore.save({
      ...localPrefs,
      branding: { ...branding, logo_url: logoPreview.value },
      source_filters: { ...sourceFilters },
    })
    saved.value = true
    setTimeout(() => { saved.value = false }, 3000)
  } finally {
    saving.value = false
  }
}
</script>
