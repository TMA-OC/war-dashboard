import { useAlertsStore } from '@/stores/alerts'
import { useSSE } from './useSSE'
import { onMounted } from 'vue'

export function useAlerts() {
  const store = useAlertsStore()

  const { connected, connect } = useSSE({
    alert: (data) => store.addAlert(data),
    strike: (data) => store.addStrike(data),
    '*': (data) => {
      if (data.type === 'alert') store.addAlert(data.payload)
      else if (data.type === 'strike') store.addStrike(data.payload)
    },
  })

  onMounted(() => {
    store.fetchAlerts(true)
    connect()
  })

  return { store, connected }
}
