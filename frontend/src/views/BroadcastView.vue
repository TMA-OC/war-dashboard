<template>
  <div class="flex flex-col h-screen bg-slate-950 select-none" ref="rootEl">
    <!-- TOP: Header -->
    <div
      class="flex items-center justify-between px-6 py-3 flex-shrink-0"
      :style="{ background: brandColor }"
    >
      <div class="flex items-center gap-3">
        <img v-if="prefs.prefs.branding?.logo_url" :src="prefs.prefs.branding.logo_url" class="h-10 object-contain" />
        <div v-else class="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center text-white font-bold">W</div>
        <span class="text-white font-medium text-sm">{{ prefs.prefs.branding?.display_name || 'Intelligence' }}</span>
      </div>
      <h1 class="font-bold text-2xl text-white tracking-widest">WAR DASHBOARD</h1>
      <div class="text-right text-white text-sm">
        <p class="font-mono">{{ utcTime }} UTC</p>
        <p class="font-mono text-white/70">{{ localTime }}</p>
      </div>
    </div>

    <!-- MAIN: Map 70% height -->
    <div class="flex-1 flex overflow-hidden" style="height: 70vh">
      <div class="flex-1 relative overflow-hidden">
        <MapView
          :strikes="alertsStore.strikes"
          :alerts="alertsStore.alerts"
          :pins="prefs.prefs.pins"
        />
      </div>

      <!-- BOTTOM-RIGHT: Top 3 breaking alerts panel -->
      <div class="w-80 flex-shrink-0 border-l bg-slate-900/95 border-slate-800 flex flex-col overflow-hidden">
        <div class="px-4 py-2 border-b border-slate-800">
          <h3 class="text-xs font-bold uppercase tracking-wider text-slate-300">Breaking Intel</h3>
        </div>
        <div class="flex-1 overflow-hidden relative">
          <transition-group name="slide" tag="div" class="absolute inset-0">
            <div
              v-for="(alert, i) in breakingAlerts"
              :key="alert.id"
              v-show="i === currentBreaking"
              class="absolute inset-0 p-4 flex flex-col"
            >
              <div class="flex items-center gap-2 mb-2">
                <span class="relative flex h-2 w-2">
                  <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-war-red opacity-75"></span>
                  <span class="relative inline-flex rounded-full h-2 w-2 bg-war-red"></span>
                </span>
                <ConfidenceBadge :label="alert.confidence_label" :score="alert.confidence_score" />
              </div>
              <h4 class="font-bold text-white text-lg leading-snug mb-3">{{ alert.headline }}</h4>
              <p class="text-slate-400 text-sm leading-relaxed flex-1">{{ alert.summary }}</p>
              <div class="flex items-center justify-between mt-3 text-xs text-slate-500">
                <span>{{ alert.sources[0]?.name }}</span>
                <span>{{ formatTime(alert.created_at) }}</span>
              </div>
              <div class="flex gap-1 mt-3 justify-center">
                <span
                  v-for="(_, j) in breakingAlerts"
                  :key="j"
                  :class="['w-1.5 h-1.5 rounded-full transition-all', j === currentBreaking ? 'bg-war-orange' : 'bg-slate-700']"
                ></span>
              </div>
            </div>
          </transition-group>
        </div>
      </div>
    </div>

    <!-- BOTTOM: Breaking ticker -->
    <BreakingTicker class="flex-shrink-0" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import MapView from '@/components/map/MapView.vue'
import BreakingTicker from '@/components/layout/BreakingTicker.vue'
import ConfidenceBadge from '@/components/alerts/ConfidenceBadge.vue'
import { useAlertsStore } from '@/stores/alerts'
import { usePreferencesStore } from '@/stores/preferences'
import { useSSE } from '@/composables/useSSE'

const alertsStore = useAlertsStore()
const prefs = usePreferencesStore()
const rootEl = ref<HTMLElement>()

const utcTime = ref('')
const localTime = ref('')
const currentBreaking = ref(0)
let clockInterval: number
let rotateInterval: number

const brandColor = computed(() => prefs.prefs.branding?.primary_color || '#ef4444')

const breakingAlerts = computed(() =>
  alertsStore.alerts
    .filter(a => a.is_breaking || a.confidence_score >= 85)
    .slice(0, 3)
)

onMounted(async () => {
  await Promise.all([
    alertsStore.fetchAlerts(true),
    alertsStore.fetchStrikes(),
    prefs.fetch(),
  ])

  clockInterval = window.setInterval(() => {
    const now = new Date()
    utcTime.value = now.toUTCString().slice(17, 22)
    localTime.value = now.toLocaleTimeString()
  }, 1000)

  rotateInterval = window.setInterval(() => {
    if (breakingAlerts.value.length > 1) {
      currentBreaking.value = (currentBreaking.value + 1) % breakingAlerts.value.length
    }
  }, 15000)

  window.addEventListener('keydown', handleKey)
  connect()
})

onUnmounted(() => {
  clearInterval(clockInterval)
  clearInterval(rotateInterval)
  window.removeEventListener('keydown', handleKey)
})

const { connect } = useSSE({
  alert: (d) => alertsStore.addAlert(d),
  strike: (d) => alertsStore.addStrike(d),
})

function handleKey(e: KeyboardEvent) {
  if (e.key.toLowerCase() === 'f') {
    if (!document.fullscreenElement) {
      rootEl.value?.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
  }
}

function formatTime(ts: string) {
  const diff = Date.now() - new Date(ts).getTime()
  if (diff < 60000) return 'Just now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  return `${Math.floor(diff / 3600000)}h ago`
}
</script>

<style scoped>
.slide-enter-active, .slide-leave-active { transition: opacity 0.5s, transform 0.5s; }
.slide-enter-from { opacity: 0; transform: translateX(20px); }
.slide-leave-to { opacity: 0; transform: translateX(-20px); }
</style>
