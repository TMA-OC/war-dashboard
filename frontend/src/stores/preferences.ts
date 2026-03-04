import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/lib/api'
import type { UserPreferences } from '@/types'

const DEFAULT_PREFS: UserPreferences = {
  nationality: [],
  pins: [],
  topic_tags: [],
  notifications_enabled: false,
}

export const usePreferencesStore = defineStore('preferences', () => {
  const prefs = ref<UserPreferences>({ ...DEFAULT_PREFS })
  const loading = ref(false)

  async function fetch() {
    loading.value = true
    try {
      const res = await api.get('/preferences')
      prefs.value = res.data
    } catch {
      // use defaults
    } finally {
      loading.value = false
    }
  }

  async function save(updates: Partial<UserPreferences>) {
    const res = await api.patch('/preferences', updates)
    prefs.value = res.data
  }

  return { prefs, loading, fetch, save }
})
