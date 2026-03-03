<template>
  <div class="w-full h-full overflow-y-auto" :style="feedStyle">
    <div class="p-3 border-b flex items-center justify-between" :style="{ borderColor: 'var(--embed-color, #f97316)30' }">
      <span class="font-bold text-sm text-white">⚡ War Dashboard</span>
      <span v-if="props.topic" class="text-xs px-2 py-0.5 rounded-full" :style="{ backgroundColor: 'var(--embed-color, #f97316)20', color: 'var(--embed-color, #f97316)' }">{{ props.topic }}</span>
    </div>

    <div v-if="loading" class="p-4 text-center text-sm text-white opacity-50">Loading alerts...</div>

    <div v-else-if="items.length === 0" class="p-4 text-center text-sm text-white opacity-50">No alerts found</div>

    <div v-else class="divide-y" :style="{ borderColor: 'rgba(255,255,255,0.05)' }">
      <div
        v-for="item in items"
        :key="item.id"
        class="p-3 hover:bg-white/5 transition-colors"
      >
        <div class="flex items-start gap-2">
          <span v-if="item.isBreaking" class="flex-shrink-0 mt-1">
            <span class="relative flex h-2 w-2">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" :style="{ backgroundColor: 'var(--embed-color, #f97316)' }"></span>
              <span class="relative inline-flex rounded-full h-2 w-2" :style="{ backgroundColor: 'var(--embed-color, #f97316)' }"></span>
            </span>
          </span>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-semibold text-white leading-snug">{{ item.headline }}</p>
            <div class="flex items-center gap-2 mt-1 text-xs opacity-50 text-white">
              <span v-if="item.location">📍 {{ item.location }}</span>
              <span>{{ item.time }}</span>
              <span class="rounded px-1 py-0.5" :style="confidenceBadgeStyle(item.confidence)">{{ item.confidenceLabel }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="p-2 text-center text-xs text-white opacity-20 border-t" :style="{ borderColor: 'rgba(255,255,255,0.05)' }">
      Powered by War Dashboard
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

const props = defineProps<{ topic?: string; color?: string; bg?: string }>()

interface AlertItem {
  id: string
  headline: string
  location: string
  time: string
  isBreaking: boolean
  confidence: number
  confidenceLabel: string
}

const items = ref<AlertItem[]>([])
const loading = ref(true)

const feedStyle = computed(() => ({
  backgroundColor: props.bg ? `#${props.bg.replace('#', '')}` : 'var(--embed-bg, #020617)',
  '--embed-color': props.color ? `#${props.color.replace('#', '')}` : '#f97316',
}))

function confidenceBadgeStyle(score: number) {
  if (score >= 0.85) return { backgroundColor: '#14532d30', color: '#4ade80' }
  if (score >= 0.6) return { backgroundColor: '#7c3aed20', color: '#a78bfa' }
  return { backgroundColor: '#7f1d1d30', color: '#f87171' }
}

function formatTime(ts: string) {
  const d = new Date(ts)
  const diff = Date.now() - d.getTime()
  if (diff < 60000) return 'just now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  return d.toLocaleDateString()
}

onMounted(async () => {
  try {
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8787'
    const params = new URLSearchParams({ limit: '20' })
    if (props.topic) params.set('topic', props.topic)
    const res = await fetch(`${apiBase}/embed/feed?${params}`)
    const json = await res.json()
    items.value = (json.data || []).map((a: any) => ({
      id: a.id,
      headline: a.headline,
      location: a.locationName || a.countryCode || '',
      time: formatTime(a.publishedAt),
      isBreaking: a.isBreaking,
      confidence: a.confidenceScore,
      confidenceLabel: a.confidenceLabel,
    }))
  } catch (e) {
    console.error('Embed feed fetch failed', e)
  } finally {
    loading.value = false
  }
})
</script>
