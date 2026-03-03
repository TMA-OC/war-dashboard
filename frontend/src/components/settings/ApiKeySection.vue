<template>
  <section class="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-4">
    <h2 class="font-semibold text-white mb-1">API Keys</h2>
    <p class="text-sm text-slate-400 mb-4">Use API keys to access export endpoints programmatically. Pass as <code class="bg-slate-800 px-1 rounded">Bearer &lt;key&gt;</code> or <code class="bg-slate-800 px-1 rounded">?api_key=&lt;key&gt;</code>.</p>

    <!-- New key just generated -->
    <div v-if="newKey" class="mb-4 bg-green-950/40 border border-green-700/40 rounded-lg p-3">
      <p class="text-green-400 text-sm font-semibold mb-1">⚠️ Copy this key now — it won't be shown again:</p>
      <div class="flex gap-2 items-center">
        <code class="flex-1 bg-slate-950 text-green-300 text-xs px-3 py-2 rounded break-all">{{ newKey }}</code>
        <button @click="copyNewKey" class="bg-slate-700 hover:bg-slate-600 text-white text-xs px-3 py-1.5 rounded whitespace-nowrap transition-colors">{{ copiedNew ? '✓ Copied!' : 'Copy' }}</button>
      </div>
      <p class="text-xs text-slate-500 mt-1">Export endpoints: <code class="bg-slate-800 px-1 rounded">/export/alerts.json</code> · <code class="bg-slate-800 px-1 rounded">/export/alerts.csv</code> · <code class="bg-slate-800 px-1 rounded">/export/stats.json</code></p>
    </div>

    <!-- Existing keys -->
    <div v-if="keys.length" class="space-y-2 mb-4">
      <div v-for="key in keys" :key="key.id" class="flex items-center gap-3 bg-slate-800 rounded-lg p-3">
        <div class="flex-1">
          <p class="text-sm text-white font-medium">{{ key.label }}</p>
          <p class="text-xs text-slate-500 font-mono">{{ key.keyPrefix }}•••••••• <span class="text-slate-600">· Created {{ formatDate(key.createdAt) }}</span><span v-if="key.lastUsedAt" class="text-slate-600"> · Last used {{ formatDate(key.lastUsedAt) }}</span></p>
        </div>
        <button @click="revokeKey(key.id)" class="text-slate-500 hover:text-war-red transition-colors text-xs px-2 py-1 rounded hover:bg-red-950/30">Revoke</button>
      </div>
    </div>
    <p v-else-if="!loading" class="text-sm text-slate-500 mb-4">No API keys yet.</p>

    <!-- Generate new key -->
    <div class="flex gap-2">
      <input v-model="newLabel" type="text" placeholder="Key label (e.g. My Export Script)" class="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-war-orange" @keydown.enter="generateKey" />
      <button @click="generateKey" :disabled="generating" class="bg-war-orange hover:bg-orange-600 disabled:opacity-50 text-white text-sm px-4 py-2 rounded-lg transition-colors whitespace-nowrap">
        {{ generating ? 'Generating...' : '+ New Key' }}
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '@/lib/api'

interface ApiKeyMeta {
  id: string
  keyPrefix: string
  label: string
  lastUsedAt?: string
  createdAt: string
}

const keys = ref<ApiKeyMeta[]>([])
const loading = ref(true)
const generating = ref(false)
const newKey = ref('')
const newLabel = ref('')
const copiedNew = ref(false)

onMounted(async () => {
  await loadKeys()
})

async function loadKeys() {
  try {
    const res = await api.get('/api-keys')
    keys.value = res.data.data.filter((k: any) => k.isActive !== false)
  } catch (e) {
    console.error('Failed to load API keys', e)
  } finally {
    loading.value = false
  }
}

async function generateKey() {
  if (generating.value) return
  generating.value = true
  try {
    const res = await api.post('/api-keys', { label: newLabel.value || 'Default' })
    newKey.value = res.data.data.key
    newLabel.value = ''
    await loadKeys()
  } catch (e) {
    console.error('Failed to generate API key', e)
  } finally {
    generating.value = false
  }
}

async function revokeKey(id: string) {
  if (!confirm('Revoke this API key? This cannot be undone.')) return
  try {
    await api.delete(`/api-keys/${id}`)
    keys.value = keys.value.filter(k => k.id !== id)
    if (newKey.value) newKey.value = ''
  } catch (e) {
    console.error('Failed to revoke API key', e)
  }
}

async function copyNewKey() {
  try { await navigator.clipboard.writeText(newKey.value) } catch {
    const ta = document.createElement('textarea')
    ta.value = newKey.value
    document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta)
  }
  copiedNew.value = true
  setTimeout(() => { copiedNew.value = false }, 2000)
}

function formatDate(ts: string) {
  return new Date(ts).toLocaleDateString()
}
</script>
