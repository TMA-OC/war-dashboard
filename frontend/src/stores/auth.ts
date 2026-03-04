import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/lib/api'
import type { User } from '@/types'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(localStorage.getItem('wardash_token'))

  const isAuthenticated = computed(() => !!token.value)
  const isPro = computed(() => user.value?.tier === 'pro')

  async function login(email: string, password: string) {
    const res = await api.post('/auth/login', { email, password })
    token.value = res.data.token
    user.value = res.data.user
    localStorage.setItem('wardash_token', res.data.token)
    return res.data.user
  }

  async function register(name: string, email: string, password: string, tier: string) {
    const res = await api.post('/auth/register', { name, email, password, tier })
    token.value = res.data.token
    user.value = res.data.user
    localStorage.setItem('wardash_token', res.data.token)
    return res.data.user
  }

  async function fetchMe() {
    if (!token.value) return
    const res = await api.get('/auth/me')
    user.value = res.data
  }

  function logout() {
    token.value = null
    user.value = null
    localStorage.removeItem('wardash_token')
  }

  return { user, token, isAuthenticated, isPro, login, register, fetchMe, logout }
})
