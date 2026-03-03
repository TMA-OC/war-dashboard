<template>
  <div class="relative h-full">
    <div ref="mapEl" class="w-full h-full"></div>

    <!-- Layer toggles -->
    <div class="absolute top-3 left-3 flex flex-col gap-2 z-10">
      <button
        v-for="layer in layers"
        :key="layer.id"
        @click="toggleLayer(layer.id)"
        :class="['px-3 py-1.5 text-xs rounded font-medium transition-all', layer.active ? 'bg-slate-700 text-white' : 'bg-slate-900/80 text-slate-400']"
      >
        {{ layer.icon }} {{ layer.label }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import type { Alert, Strike, Pin } from '@/types'
import { renderMapPopup } from '@/components/map/MapPopup.vue'

const props = defineProps<{
  alerts?: Alert[]
  strikes?: Strike[]
  pins?: Pin[]
  flyToAlert?: Alert | null
}>()

const mapEl = ref<HTMLElement>()
let map: any = null
let mapboxgl: any = null

const layers = ref([
  { id: 'pins', label: 'My Pins', icon: '📍', active: true },
  { id: 'alerts', label: 'Alerts', icon: '🔶', active: true },
  { id: 'strikes', label: 'Strikes', icon: '💥', active: true },
])

function toggleLayer(id: string) {
  const layer = layers.value.find(l => l.id === id)
  if (!layer || !map) return
  layer.active = !layer.active
  const vis = layer.active ? 'visible' : 'none'
  if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', vis)
  if (map.getLayer(id + '-labels')) map.setLayoutProperty(id + '-labels', 'visibility', vis)
  if (map.getLayer(id + '-clusters')) map.setLayoutProperty(id + '-clusters', 'visibility', vis)
  if (map.getLayer(id + '-count')) map.setLayoutProperty(id + '-count', 'visibility', vis)
  if (map.getLayer(id + '-unclustered')) map.setLayoutProperty(id + '-unclustered', 'visibility', vis)
  if (map.getLayer(id + '-radius')) map.setLayoutProperty(id + '-radius', 'visibility', vis)
}

async function initMap() {
  if (!mapEl.value) return

  // Dynamic import to reduce initial bundle size (~1.7MB)
  mapboxgl = (await import('mapbox-gl')).default
  await import('mapbox-gl/dist/mapbox-gl.css')

  mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || ''

  map = new mapboxgl.Map({
    container: mapEl.value,
    style: 'mapbox://styles/mapbox/satellite-streets-v12',
    center: [35, 31],
    zoom: 4,
  })

  map.addControl(new mapboxgl.NavigationControl(), 'bottom-right')

  map.on('load', () => {
    setupPinsLayer()
    setupAlertsLayer()
    setupStrikesLayer()
  })
}

function setupPinsLayer() {
  if (!map) return
  const pins = props.pins || []

  map.addSource('pins', {
    type: 'geojson',
    data: {
      type: 'FeatureCollection',
      features: pins.map(p => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [p.lng, p.lat] },
        properties: { id: p.id, label: p.label, radius: p.radius, radiusKm: p.radius },
      })),
    },
  })

  // Radius circles showing alert area
  map.addLayer({
    id: 'pins-radius',
    type: 'circle',
    source: 'pins',
    paint: {
      'circle-radius': ['/', ['*', ['get', 'radiusKm'], 1000], 1],
      'circle-color': '#3b82f6',
      'circle-opacity': 0.08,
      'circle-stroke-width': 1,
      'circle-stroke-color': '#3b82f6',
      'circle-stroke-opacity': 0.3,
    },
  })

  map.addLayer({
    id: 'pins',
    type: 'circle',
    source: 'pins',
    paint: {
      'circle-radius': 8,
      'circle-color': '#ef4444',
      'circle-stroke-color': '#fff',
      'circle-stroke-width': 2,
    },
  })

  map.addLayer({
    id: 'pins-labels',
    type: 'symbol',
    source: 'pins',
    layout: {
      'text-field': ['get', 'label'],
      'text-offset': [0, 1.5],
      'text-size': 12,
      'text-anchor': 'top',
    },
    paint: { 'text-color': '#ffffff', 'text-halo-color': '#000', 'text-halo-width': 1 },
  })
}

function setupAlertsLayer() {
  if (!map) return
  const alerts = (props.alerts || []).filter(a => a.lat && a.lng)

  map.addSource('alerts', {
    type: 'geojson',
    cluster: true,
    clusterMaxZoom: 12,
    clusterRadius: 50,
    data: {
      type: 'FeatureCollection',
      features: alerts.map(a => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [a.lng!, a.lat!] },
        properties: {
          id: a.id,
          headline: a.headline,
          confidence: a.confidence_label,
          score: a.confidence_score,
          location: a.location,
          published_at: a.created_at,
          sources: JSON.stringify(a.sources || []),
        },
      })),
    },
  })

  map.addLayer({
    id: 'alerts-clusters',
    type: 'circle',
    source: 'alerts',
    filter: ['has', 'point_count'],
    paint: {
      'circle-radius': ['step', ['get', 'point_count'], 20, 10, 30, 30, 40],
      'circle-color': '#f97316',
      'circle-opacity': 0.8,
    },
  })

  map.addLayer({
    id: 'alerts-count',
    type: 'symbol',
    source: 'alerts',
    filter: ['has', 'point_count'],
    layout: { 'text-field': '{point_count_abbreviated}', 'text-size': 12 },
    paint: { 'text-color': '#fff' },
  })

  map.addLayer({
    id: 'alerts-unclustered',
    type: 'circle',
    source: 'alerts',
    filter: ['!', ['has', 'point_count']],
    paint: {
      'circle-radius': 8,
      'circle-color': '#f97316',
      'circle-stroke-color': '#fff',
      'circle-stroke-width': 1.5,
    },
  })

  map.on('click', 'alerts-unclustered', (e: any) => {
    if (!e.features?.[0] || !map) return
    const p = e.features[0].properties!
    const coords = (e.features[0].geometry as any).coordinates.slice()
    let sources: any[] = []
    try { sources = JSON.parse(p.sources || '[]') } catch {}
    const html = renderMapPopup({
      headline: p.headline,
      confidence_label: p.confidence,
      confidence_score: p.score,
      location: p.location,
      published_at: p.published_at,
      sources,
    })
    new mapboxgl.Popup({ maxWidth: '320px' })
      .setLngLat(coords)
      .setHTML(html)
      .addTo(map)
  })
}

function setupStrikesLayer() {
  if (!map) return
  const strikes = props.strikes || []

  map.addSource('strikes', {
    type: 'geojson',
    data: {
      type: 'FeatureCollection',
      features: strikes.map(s => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [s.lng, s.lat] },
        properties: { id: s.id, location: s.location, type: s.type },
      })),
    },
  })

  map.addLayer({
    id: 'strikes',
    type: 'symbol',
    source: 'strikes',
    layout: { 'text-field': '💥', 'text-size': 18 },
  })
}

watch(() => props.flyToAlert, (alert) => {
  if (!alert || !alert.lat || !alert.lng || !map) return
  map.flyTo({ center: [alert.lng, alert.lat], zoom: 10, duration: 2000 })
  setTimeout(() => {
    if (!map) return
    new mapboxgl.Popup({ closeOnClick: false })
      .setLngLat([alert.lng!, alert.lat!])
      .setHTML(`<div class="p-2"><p class="font-bold text-sm">${alert.headline}</p></div>`)
      .addTo(map)
  }, 2200)
})

onMounted(initMap)
onUnmounted(() => map?.remove())
</script>
