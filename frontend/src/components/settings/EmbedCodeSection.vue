<template>
  <section class="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-4">
    <h2 class="font-semibold text-white mb-1">Embeddable Widget</h2>
    <p class="text-sm text-slate-400 mb-4">Embed a live alert ticker or feed on any external page — no authentication required.</p>

    <div class="flex gap-2 mb-4">
      <button
        v-for="t in ['ticker', 'feed']"
        :key="t"
        @click="widgetType = t"
        :class="['px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize', widgetType === t ? 'bg-war-orange text-white' : 'bg-slate-800 text-slate-400 hover:text-white']"
      >{{ t }}</button>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
      <div>
        <label class="block text-xs text-slate-400 mb-1">Topic Filter</label>
        <input v-model="topic" type="text" placeholder="e.g. Airstrikes" class="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-war-orange" />
      </div>
      <div>
        <label class="block text-xs text-slate-400 mb-1">Accent Color</label>
        <div class="flex gap-2 items-center">
          <input v-model="accentColor" type="color" class="h-9 w-9 rounded cursor-pointer border border-slate-700 bg-slate-800" />
          <input v-model="accentColor" type="text" class="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-war-orange" />
        </div>
      </div>
      <div>
        <label class="block text-xs text-slate-400 mb-1">Background Color</label>
        <div class="flex gap-2 items-center">
          <input v-model="bgColor" type="color" class="h-9 w-9 rounded cursor-pointer border border-slate-700 bg-slate-800" />
          <input v-model="bgColor" type="text" class="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-war-orange" />
        </div>
      </div>
    </div>

    <div class="mb-4">
      <label class="block text-xs text-slate-400 mb-2">Preview</label>
      <div class="border border-slate-700 rounded-lg overflow-hidden" :style="{ height: widgetType === 'feed' ? '300px' : '60px' }">
        <iframe :src="embedUrl" class="w-full h-full border-0" sandbox="allow-scripts allow-same-origin" title="Widget preview"></iframe>
      </div>
    </div>

    <div>
      <label class="block text-xs text-slate-400 mb-2">Embed Code</label>
      <div class="relative">
        <pre class="bg-slate-950 border border-slate-700 rounded-lg p-3 text-xs text-slate-300 overflow-x-auto whitespace-pre-wrap">{{ embedCode }}</pre>
        <button @click="copyCode" class="absolute top-2 right-2 bg-slate-700 hover:bg-slate-600 text-white text-xs px-3 py-1 rounded transition-colors">{{ copied ? '✓ Copied!' : 'Copy' }}</button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const widgetType = ref('ticker')
const topic = ref('')
const accentColor = ref('#f97316')
const bgColor = ref('#020617')
const copied = ref(false)

const baseUrl = computed(() => window.location.origin)

const embedUrl = computed(() => {
  const params = new URLSearchParams({ type: widgetType.value, color: accentColor.value.replace('#', ''), bg: bgColor.value.replace('#', '') })
  if (topic.value) params.set('topic', topic.value)
  return `${baseUrl.value}/embed?${params}`
})

const iframeHeight = computed(() => widgetType.value === 'feed' ? 400 : 56)

const embedCode = computed(() =>
  `<iframe\n  src="${embedUrl.value}"\n  width="100%"\n  height="${iframeHeight.value}"\n  frameborder="0"\n  sandbox="allow-scripts allow-same-origin"\n  title="War Dashboard Widget"\n></iframe>`
)

async function copyCode() {
  try {
    await navigator.clipboard.writeText(embedCode.value)
  } catch {
    const ta = document.createElement('textarea')
    ta.value = embedCode.value
    document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta)
  }
  copied.value = true
  setTimeout(() => { copied.value = false }, 2000)
}
</script>
