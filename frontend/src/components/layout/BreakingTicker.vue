<template>
  <div class="overflow-hidden bg-slate-950 border-t border-slate-800" :style="brandStyle">
    <div class="flex items-center">
      <div class="flex-shrink-0 bg-war-red px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-white">
        Breaking
      </div>
      <div class="flex-1 overflow-hidden">
        <div class="ticker-track flex whitespace-nowrap" :style="{ animationDuration: `${duration}s` }">
          <span
            v-for="(item, i) in tickerItems"
            :key="i"
            class="inline-flex items-center gap-3 px-8 text-sm text-white"
          >
            <span class="font-semibold">{{ item.headline }}</span>
            <span class="text-slate-400">{{ item.source }}</span>
            <span class="text-slate-500">{{ item.time }}</span>
            <span class="text-slate-600">◆</span>
          </span>
          <!-- Duplicate for seamless loop -->
          <span
            v-for="(item, i) in tickerItems"
            :key="'dup-' + i"
            class="inline-flex items-center gap-3 px-8 text-sm text-white"
          >
            <span class="font-semibold">{{ item.headline }}</span>
            <span class="text-slate-400">{{ item.source }}</span>
            <span class="text-slate-500">{{ item.time }}</span>
            <span class="text-slate-600">◆</span>
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAlertsStore } from '@/stores/alerts'
import { usePreferencesStore } from '@/stores/preferences'

const store = useAlertsStore()
const prefs = usePreferencesStore()

const tickerItems = computed(() =>
  store.alerts
    .filter(a => a.is_breaking || a.confidence_score >= 85)
    .slice(0, 20)
    .map(a => ({
      headline: a.headline,
      source: a.sources[0]?.name || '',
      time: formatTime(a.created_at),
    }))
)

const duration = computed(() => Math.max(30, tickerItems.value.length * 8))

const brandStyle = computed(() => {
  const color = prefs.prefs.branding?.primary_color
  return color ? { borderTopColor: color } : {}
})

function formatTime(ts: string) {
  const d = new Date(ts)
  const diff = Date.now() - d.getTime()
  if (diff < 60000) return 'now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`
  return `${Math.floor(diff / 3600000)}h`
}
</script>

<style scoped>
.ticker-track {
  animation: ticker-scroll linear infinite;
}

@keyframes ticker-scroll {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}
</style>
