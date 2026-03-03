<template>
  <!-- Minimal embed page — no nav, no auth, no chrome -->
  <div class="embed-root" :style="rootStyle">
    <component :is="widgetComponent" :topic="topic" :color="color" :bg="bg" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import EmbedTicker from '@/components/embed/EmbedTicker.vue'
import EmbedFeed from '@/components/embed/EmbedFeed.vue'

const route = useRoute()

const type = computed(() => (route.query.type as string) || 'ticker')
const topic = computed(() => (route.query.topic as string) || '')
const color = computed(() => (route.query.color as string) || '#f97316') // war-orange default
const bg = computed(() => (route.query.bg as string) || '#020617')       // slate-950 default

const widgetComponent = computed(() => (type.value === 'feed' ? EmbedFeed : EmbedTicker))

const rootStyle = computed(() => ({
  '--embed-color': `#${color.value.replace('#', '')}`,
  '--embed-bg': `#${bg.value.replace('#', '')}`,
  backgroundColor: `#${bg.value.replace('#', '')}`,
  minHeight: '100vh',
  margin: 0,
  padding: 0,
}))
</script>

<style>
body { margin: 0; padding: 0; }
.embed-root { font-family: Inter, system-ui, sans-serif; }
</style>
