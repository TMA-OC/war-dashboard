<template>
  <div class="flex flex-col h-full">
    <!-- Header -->
    <div class="flex items-center justify-between px-4 py-3 border-b border-slate-800">
      <h2 class="font-semibold text-white">Intelligence Feed</h2>
      <div class="flex items-center gap-2">
        <span v-if="connected" class="flex items-center gap-1 text-xs text-war-green">
          <span class="w-1.5 h-1.5 bg-war-green rounded-full"></span>
          Live
        </span>
        <span v-else class="text-xs text-slate-500">Reconnecting...</span>
      </div>
    </div>

    <!-- Feed -->
    <div ref="feedEl" class="flex-1 overflow-y-auto p-4 space-y-3" @scroll="onScroll">
      <!-- Skeleton loading -->
      <template v-if="store.loading && store.alerts.length === 0">
        <div v-for="n in 5" :key="n" class="bg-slate-900 border border-slate-800 rounded-lg p-4 animate-pulse">
          <div class="h-4 bg-slate-700 rounded mb-2 w-3/4"></div>
          <div class="h-3 bg-slate-800 rounded mb-1"></div>
          <div class="h-3 bg-slate-800 rounded w-2/3"></div>
        </div>
      </template>

      <!-- Empty state -->
      <div v-else-if="!store.loading && store.alerts.length === 0" class="text-center py-16 text-slate-500">
        <div class="text-4xl mb-3">📡</div>
        <p>No alerts yet</p>
        <p class="text-sm mt-1">Monitoring live feeds...</p>
      </div>

      <!-- Alerts -->
      <AlertCard
        v-for="alert in store.alerts"
        :key="alert.id"
        :alert="alert"
      />

      <!-- Load more spinner -->
      <div v-if="store.loading && store.alerts.length > 0" class="text-center py-4">
        <div class="inline-block w-6 h-6 border-2 border-slate-600 border-t-war-orange rounded-full animate-spin"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import AlertCard from './AlertCard.vue'
import { useAlerts } from '@/composables/useAlerts'

const feedEl = ref<HTMLElement>()
const { store, connected } = useAlerts()

function onScroll() {
  if (!feedEl.value || store.loading || !store.hasMore) return
  const el = feedEl.value
  if (el.scrollTop + el.clientHeight >= el.scrollHeight - 200) {
    store.fetchAlerts()
  }
}
</script>
