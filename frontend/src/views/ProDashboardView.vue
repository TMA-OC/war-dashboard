<template>
  <div class="flex flex-col h-screen bg-slate-950">
    <AppHeader />
    <BreakingTicker />

    <div class="flex-1 flex overflow-hidden">
      <!-- Left: Full strikes map (70%) -->
      <div class="flex-1 relative overflow-hidden">
        <MapView
          :strikes="alertsStore.strikes"
          :pins="prefs.prefs.pins"
          :alerts="alertsStore.alerts"
        />

        <!-- Legend overlay -->
        <div class="absolute top-3 right-3 bg-slate-900/90 border border-slate-700 rounded-lg p-3 z-10">
          <p class="text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wider">Strike Recency</p>
          <div class="space-y-1.5">
            <div v-for="tier in legendTiers" :key="tier.label" class="flex items-center gap-2 text-xs">
              <span :class="['w-3 h-3 rounded-full flex-shrink-0', tier.pulse ? 'animate-ping' : '']" :style="{ background: tier.color }"></span>
              <span class="text-slate-300">{{ tier.label }}</span>
              <span class="ml-auto font-mono text-slate-400 font-bold">{{ tier.count }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Right: Data panels -->
      <div class="w-80 flex-shrink-0 border-l border-slate-800 flex flex-col overflow-hidden">
        <!-- Casualties -->
        <div class="p-4 border-b border-slate-800">
          <h3 class="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Casualties (24h)</h3>
          <div v-if="alertsStore.casualties" class="grid grid-cols-2 gap-3">
            <div class="bg-slate-900 rounded-lg p-3">
              <p class="text-2xl font-bold text-war-red">{{ alertsStore.casualties.killed_24h.toLocaleString() }}</p>
              <p class="text-xs text-slate-400 mt-0.5">Confirmed Killed</p>
            </div>
            <div class="bg-slate-900 rounded-lg p-3">
              <p class="text-2xl font-bold text-war-orange">{{ alertsStore.casualties.wounded_24h.toLocaleString() }}</p>
              <p class="text-xs text-slate-400 mt-0.5">Wounded</p>
            </div>
          </div>
          <div v-else class="text-slate-600 text-sm">No data</div>
          <p v-if="alertsStore.casualties" class="text-xs text-slate-600 mt-2">
            Updated {{ formatTime(alertsStore.casualties.updated_at) }}
          </p>
        </div>

        <!-- Topic feed -->
        <div class="flex-1 overflow-y-auto p-4">
          <h3 class="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
            Topic Feed
            <span v-if="prefs.prefs.topic_tags.length" class="ml-1 text-war-orange">({{ prefs.prefs.topic_tags.length }} tags)</span>
          </h3>
          <div class="space-y-2">
            <div
              v-for="alert in filteredAlerts"
              :key="alert.id"
              class="bg-slate-900 border border-slate-800 rounded-lg p-3 hover:border-slate-600 cursor-pointer transition-all"
            >
              <div class="flex items-start gap-2 mb-1">
                <span v-if="alert.is_breaking" class="flex-shrink-0 w-1.5 h-1.5 mt-1.5 bg-war-red rounded-full animate-pulse"></span>
                <p class="text-sm text-white font-medium leading-snug">{{ alert.headline }}</p>
              </div>
              <div class="flex items-center gap-2 text-xs text-slate-500">
                <span>{{ formatTime(alert.created_at) }}</span>
                <ConfidenceBadge :label="alert.confidence_label" :score="alert.confidence_score" />
              </div>
            </div>
            <div v-if="filteredAlerts.length === 0" class="text-center text-slate-600 text-sm py-8">
              <p>No alerts for your topics</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import AppHeader from '@/components/layout/AppHeader.vue'
import BreakingTicker from '@/components/layout/BreakingTicker.vue'
import MapView from '@/components/map/MapView.vue'
import ConfidenceBadge from '@/components/alerts/ConfidenceBadge.vue'
import { useAlertsStore } from '@/stores/alerts'
import { usePreferencesStore } from '@/stores/preferences'
import { useSSE } from '@/composables/useSSE'

const alertsStore = useAlertsStore()
const prefs = usePreferencesStore()

onMounted(async () => {
  await Promise.all([
    alertsStore.fetchAlerts(true),
    alertsStore.fetchStrikes(),
    alertsStore.fetchCasualties(),
    prefs.fetch(),
  ])
})

const { connect } = useSSE({
  alert: (data) => alertsStore.addAlert(data),
  strike: (data) => alertsStore.addStrike(data),
})
connect()

const filteredAlerts = computed(() => {
  const tags = prefs.prefs.topic_tags.map(t => t.toLowerCase())
  if (!tags.length) return alertsStore.alerts.slice(0, 50)
  return alertsStore.alerts.filter(a =>
    tags.some(t => a.category?.toLowerCase().includes(t) || a.headline?.toLowerCase().includes(t))
  ).slice(0, 50)
})

function getRecencyTier(ts: string) {
  const diff = Date.now() - new Date(ts).getTime()
  if (diff < 15 * 60000) return 0
  if (diff < 2 * 3600000) return 1
  if (diff < 86400000) return 2
  return 3
}

const legendTiers = computed(() => {
  const tiers = [
    { label: '< 15 min', color: '#ef4444', pulse: true, count: 0 },
    { label: '< 2 hours', color: '#f97316', pulse: false, count: 0 },
    { label: 'Today', color: '#eab308', pulse: false, count: 0 },
    { label: 'Earlier', color: '#6b7280', pulse: false, count: 0 },
  ]
  for (const s of alertsStore.strikes) {
    tiers[getRecencyTier(s.created_at)].count++
  }
  return tiers
})

function formatTime(ts: string) {
  const d = new Date(ts)
  const diff = Date.now() - d.getTime()
  if (diff < 60000) return 'Just now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  return `${Math.floor(diff / 3600000)}h ago`
}
</script>
