<template>
  <div
    :class="[
      'relative bg-slate-900 border rounded-lg cursor-pointer transition-all hover:border-slate-600',
      alert.is_breaking ? 'border-red-500/50' : 'border-slate-800',
      !alert.read ? 'border-l-2 border-l-war-orange' : '',
    ]"
    @click="toggle"
  >
    <!-- Breaking badge -->
    <div v-if="alert.is_breaking" class="absolute top-2 right-2 flex items-center gap-1.5">
      <span class="relative flex h-2 w-2">
        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-war-red opacity-75"></span>
        <span class="relative inline-flex rounded-full h-2 w-2 bg-war-red"></span>
      </span>
      <span class="text-xs font-bold text-war-red uppercase tracking-wider">Breaking</span>
    </div>

    <div class="p-4">
      <!-- Top bar -->
      <div class="flex items-start gap-3 mb-2 pr-20">
        <span class="text-xl flex-shrink-0">{{ categoryIcon }}</span>
        <h3 class="font-bold text-white text-sm leading-snug">{{ alert.headline }}</h3>
      </div>

      <!-- Summary -->
      <p class="text-slate-400 text-sm mb-3 leading-relaxed">{{ alert.summary }}</p>

      <!-- Expanded content -->
      <div v-if="expanded && alert.content" class="mb-3 p-3 bg-slate-800/60 rounded text-sm text-slate-300 leading-relaxed">
        {{ alert.content }}
      </div>

      <!-- Bottom row -->
      <div class="flex flex-wrap items-center gap-2 text-xs text-slate-500">
        <span>{{ formatTime(alert.created_at) }}</span>
        <span v-if="alert.location" class="bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
          📍 {{ alert.location }}
        </span>
        <ConfidenceBadge :label="alert.confidence_label" :score="alert.confidence_score" />
        <div class="flex items-center gap-2 ml-auto">
          <SourceIcon :sources="alert.sources" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import ConfidenceBadge from './ConfidenceBadge.vue'
import SourceIcon from './SourceIcon.vue'
import type { Alert } from '@/types'
import { useAlertsStore } from '@/stores/alerts'

const props = defineProps<{ alert: Alert }>()
const expanded = ref(false)
const store = useAlertsStore()

const ICONS: Record<string, string> = {
  airstrike: '💥', naval: '⚓', missiles: '🚀', ceasefire: '🕊️',
  sanctions: '🏦', nuclear: '☢️', hostages: '🔗', refugees: '🏕️',
  diplomatic: '🤝', default: '📡',
}

const categoryIcon = computed(() => ICONS[props.alert.category?.toLowerCase()] || ICONS.default)

function toggle() {
  expanded.value = !expanded.value
  if (!props.alert.read) store.markRead(props.alert.id)
}

function formatTime(ts: string) {
  const d = new Date(ts)
  const diff = Date.now() - d.getTime()
  if (diff < 60000) return 'Just now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  return d.toLocaleDateString()
}
</script>
