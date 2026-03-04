<template>
  <div class="map-popup bg-slate-900 border border-slate-700 rounded-lg p-3 text-white shadow-xl" style="min-width:220px;max-width:300px;">
    <div class="flex items-start gap-2 mb-2">
      <span
        :class="[
          'flex-shrink-0 text-xs font-bold px-1.5 py-0.5 rounded uppercase tracking-wide',
          confidence_label === 'CONFIRMED' ? 'bg-war-green/20 text-war-green' :
          confidence_label === 'LIKELY' ? 'bg-war-orange/20 text-war-orange' :
          'bg-slate-700 text-slate-300'
        ]"
      >{{ confidence_label }}</span>
      <span class="text-xs text-slate-400">{{ confidence_score }}%</span>
    </div>
    <p class="font-semibold text-sm leading-snug mb-2">{{ headline }}</p>
    <div class="text-xs text-slate-400 space-y-1">
      <p v-if="location">📍 {{ location }}</p>
      <p v-if="published_at">🕐 {{ formatTime(published_at) }}</p>
      <p v-if="sources && sources.length">🔗 {{ sources.map((s: any) => s.name).join(', ') }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  headline: string
  confidence_label: string
  confidence_score: number
  location?: string
  published_at?: string
  sources?: { name: string; url?: string }[]
}>()

function formatTime(ts: string) {
  const diff = Date.now() - new Date(ts).getTime()
  if (diff < 60000) return 'Just now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  return `${Math.floor(diff / 3600000)}h ago`
}
</script>

<script lang="ts">
// renderMapPopup: render popup data to HTML string for use with Mapbox GL JS popups
export function renderMapPopup(data: {
  headline: string
  confidence_label: string
  confidence_score: number
  location?: string
  published_at?: string
  sources?: { name: string }[]
}): string {
  const confClass = data.confidence_label === 'CONFIRMED'
    ? 'background:#14532d;color:#22c55e'
    : data.confidence_label === 'LIKELY'
    ? 'background:#431407;color:#f97316'
    : 'background:#334155;color:#94a3b8'

  const formatTime = (ts: string) => {
    const diff = Date.now() - new Date(ts).getTime()
    if (diff < 60000) return 'Just now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    return `${Math.floor(diff / 3600000)}h ago`
  }

  const sourcesStr = data.sources?.map(s => s.name).join(', ') || ''

  return `
    <div style="background:#0f172a;border:1px solid #334155;border-radius:8px;padding:12px;color:#fff;min-width:220px;max-width:300px;font-family:system-ui,sans-serif;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
        <span style="font-size:10px;font-weight:700;padding:2px 6px;border-radius:4px;text-transform:uppercase;letter-spacing:0.05em;${confClass}">${data.confidence_label}</span>
        <span style="font-size:11px;color:#94a3b8;">${data.confidence_score}%</span>
      </div>
      <p style="font-weight:600;font-size:13px;line-height:1.4;margin:0 0 8px;">${data.headline}</p>
      <div style="font-size:11px;color:#94a3b8;">
        ${data.location ? `<p style="margin:2px 0;">📍 ${data.location}</p>` : ''}
        ${data.published_at ? `<p style="margin:2px 0;">🕐 ${formatTime(data.published_at)}</p>` : ''}
        ${sourcesStr ? `<p style="margin:2px 0;">🔗 ${sourcesStr}</p>` : ''}
      </div>
    </div>
  `
}
</script>
