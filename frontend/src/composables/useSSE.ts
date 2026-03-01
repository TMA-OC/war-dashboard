import { ref, onUnmounted } from 'vue'

type SSEHandler = (data: any) => void

export function useSSE(handlers: Record<string, SSEHandler>) {
  const connected = ref(false)
  let es: EventSource | null = null

  function connect() {
    const token = localStorage.getItem('wardash_token')
    const base = import.meta.env.VITE_API_URL || 'http://localhost:8787'
    const url = `${base}/sse/alerts?token=${token}`

    es = new EventSource(url)

    es.onopen = () => { connected.value = true }
    es.onerror = () => {
      connected.value = false
      // reconnect after 5s
      setTimeout(connect, 5000)
    }

    for (const [event, handler] of Object.entries(handlers)) {
      es.addEventListener(event, (e: MessageEvent) => {
        try { handler(JSON.parse(e.data)) } catch { handler(e.data) }
      })
    }

    // default message event
    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data)
        const handler = handlers[data.type] || handlers['*']
        if (handler) handler(data)
      } catch {}
    }
  }

  function disconnect() {
    es?.close()
    es = null
    connected.value = false
  }

  onUnmounted(disconnect)

  return { connected, connect, disconnect }
}
