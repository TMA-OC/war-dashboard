<template>
  <div class="overflow-hidden w-full" :style="tickerStyle">
    <div v-if="loading" class="flex items-center justify-center py-3 text-sm" :style="{ color: 'var(--embed-color)' }">
      Loading...
    </div>
    <div v-else-if="items.length === 0" class="flex items-center justify-center py-3 text-sm opacity-60" :style="{ color: 'var(--embed-color)' }">
      No breaking alerts
    </div>
    <div v-else class="flex items-center">
      <div class="flex-shrink-0 px-3 py-2 text-xs font-bold uppercase tracking-widest text-white" :style="{ backgroundColor: 'var(--embed-color)' }">
        Breaking
      </div>
      <div class="flex-1 overflow-hidden">
        <div class="ticker-track flex whitespace-nowrap" :style="{ animationDuration: `${duration}s` }">
          <span v-for="(item, i) in items" :key="i" class="inline-flex items-center gap-3 px-8 text-sm" :style="{ color: 'var(--embed-color, #f97316)' }">
            <span class="font-semibold text-white">{{ item.headline }}</span>
            <span class="opacity-60">{{ item.location }}</span>
            <span class="opacity-40">{{ item.time }}</span>
            <span class="opacity-30">◆</span>
          </span>
          <span v-for="(item, i) in items" :key="'d'+i" class="inline-flex items-center gap-3 px-8 text-sm">
            <span class="font-semibold text-white">{{ item.headline }}</span>
            <span class="opacity-60" :style="{ color: 'var(--embed-color)' }">{{ item.location }}</span>
            <span class="opacity-40 text-white">{{ item.time }}</span>
            <span class="opacity-30 text-white">◆</span>
          </span>
        </div>
      </div>
    </div>
    <div class="text-right px-2 py-0.5 text-xs opacity-30 text-white">
      War Dashboard
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

const props = defineProps<{ topic?: string; color?: string; bg?: string }>()

const items = ref<{ headline: string; location: string; time: string }[]>([])
const loading = ref(true)

const tickerStyle = computed(() => ({
  backgroundColor: props.bg ? `#${props.bg.replace('#', '')}` : 'var(--embed-bg, #020617)',
  borderTop: `2px solid ${props.color ? `#${props.color.replace('#', '')}` : 'var(--embed-color, #f97316)'}`,
}))

const duration = computed(() => Math.max(30, items.value.length * 8))

function formatTime(ts: string) {
  const d = new Date(ts)
  const diff = Date.now() - d.getTime()
  if (diff < 60000) return 'now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  return `${Math.floor(diff / 3600000)}h ago`
}

onMounted(async () => {
  try {
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8787'
    const params = new URLSearchParams({ limit: '20' })
    if (props.topic) params.set('topic', props.topic)
    const res = await fetch(`${apiBase}/embed/feed?${params}`)
    const json = await res.json()
    items.value = (json.data || []).map((a: any) => ({
      headline: a.headline,
      location: a.locationName || a.countryCode || '',
      time: formatTime(a.publishedAt),
    }))
  } catch (e) {
    console.error('Embed ticker fetch failed', e)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.ticker-track { animation: ticker-scroll linear infinite; }
@keyframes ticker-scroll {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}
</style>
