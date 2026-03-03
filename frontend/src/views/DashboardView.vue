<template>
  <div class="flex flex-col h-screen">
    <AppHeader />
    <div class="flex-1 flex overflow-hidden">
      <!-- Alert Feed (left) -->
      <div class="w-full md:w-1/2 lg:w-2/5 border-r border-slate-800 overflow-hidden flex flex-col">
        <AlertFeed />
      </div>
      <!-- Map (right) -->
      <div class="hidden md:block flex-1 overflow-hidden">
        <MapView
          :alerts="alertsStore.alerts"
          :strikes="alertsStore.strikes"
          :pins="prefs.prefs.pins"
          :fly-to-alert="latestGeoAlert"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import AppHeader from '@/components/layout/AppHeader.vue'
import AlertFeed from '@/components/alerts/AlertFeed.vue'
import MapView from '@/components/map/MapView.vue'
import { useAlertsStore } from '@/stores/alerts'
import { usePreferencesStore } from '@/stores/preferences'

const alertsStore = useAlertsStore()
const prefs = usePreferencesStore()

prefs.fetch()

const latestGeoAlert = computed(() =>
  alertsStore.alerts.find(a => a.lat && a.lng) || null
)
</script>
