import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/lib/api'
import type { Alert, Strike, Casualties } from '@/types'

export const useAlertsStore = defineStore('alerts', () => {
  const alerts = ref<Alert[]>([])
  const strikes = ref<Strike[]>([])
  const casualties = ref<Casualties | null>(null)
  const loading = ref(false)
  const page = ref(1)
  const hasMore = ref(true)

  async function fetchAlerts(reset = false) {
    if (loading.value) return
    if (reset) {
      alerts.value = []
      page.value = 1
      hasMore.value = true
    }
    loading.value = true
    try {
      const res = await api.get('/alerts', { params: { page: page.value, limit: 20 } })
      const newAlerts = res.data.alerts || res.data
      if (newAlerts.length < 20) hasMore.value = false
      alerts.value.push(...newAlerts)
      page.value++
    } finally {
      loading.value = false
    }
  }

  async function fetchStrikes() {
    const res = await api.get('/strikes')
    strikes.value = res.data.strikes || res.data
  }

  async function fetchCasualties() {
    const res = await api.get('/casualties')
    casualties.value = res.data
  }

  function addAlert(alert: Alert) {
    alerts.value.unshift(alert)
  }

  function addStrike(strike: Strike) {
    strikes.value.unshift(strike)
  }

  function markRead(id: string) {
    const a = alerts.value.find(a => a.id === id)
    if (a) a.read = true
  }

  return { alerts, strikes, casualties, loading, hasMore, fetchAlerts, fetchStrikes, fetchCasualties, addAlert, addStrike, markRead }
})
