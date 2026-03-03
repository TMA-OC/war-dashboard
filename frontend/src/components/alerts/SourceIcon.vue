<template>
  <a
    v-for="source in sources"
    :key="source.url"
    :href="source.url"
    target="_blank"
    rel="noopener noreferrer"
    class="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors"
    :title="source.name"
  >
    <img
      v-if="source.favicon"
      :src="source.favicon"
      :alt="source.name"
      class="w-4 h-4 rounded-sm"
      @error="(e) => (e.target as HTMLImageElement).style.display = 'none'"
    />
    <img
      v-else
      :src="`https://www.google.com/s2/favicons?domain=${getDomain(source.url)}&sz=16`"
      :alt="source.name"
      class="w-4 h-4 rounded-sm"
    />
    <span class="hidden sm:inline">{{ source.name }}</span>
  </a>
</template>

<script setup lang="ts">
import type { Source } from '@/types'

defineProps<{ sources: Source[] }>()

function getDomain(url: string) {
  try { return new URL(url).hostname } catch { return url }
}
</script>
