<template>
  <div class="min-h-screen bg-slate-950 flex items-center justify-center p-4">
    <div class="w-full max-w-md">
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-war-red tracking-wider">WAR DASHBOARD</h1>
        <p class="text-slate-500 text-sm mt-1">Intelligence Platform</p>
      </div>

      <div class="bg-slate-900 border border-slate-800 rounded-xl p-8">
        <h2 class="text-xl font-semibold text-white mb-6">Sign In</h2>

        <form @submit.prevent="submit" class="space-y-4">
          <div>
            <label class="block text-sm text-slate-400 mb-1">Email</label>
            <input
              v-model="email"
              type="email"
              required
              class="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-war-orange transition-colors"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label class="block text-sm text-slate-400 mb-1">Password</label>
            <input
              v-model="password"
              type="password"
              required
              class="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-war-orange transition-colors"
              placeholder="••••••••"
            />
          </div>

          <div v-if="error" class="text-war-red text-sm bg-red-950/40 border border-red-900/50 rounded-lg px-3 py-2">
            {{ error }}
          </div>

          <button
            type="submit"
            :disabled="loading"
            class="w-full bg-war-red hover:bg-red-600 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition-colors"
          >
            {{ loading ? 'Signing in...' : 'Sign In' }}
          </button>
        </form>

        <div class="relative my-4">
          <div class="absolute inset-0 flex items-center"><div class="w-full border-t border-slate-800"></div></div>
          <div class="relative text-center"><span class="bg-slate-900 px-3 text-xs text-slate-500">or</span></div>
        </div>

        <a
          :href="`${apiBase}/auth/google`"
          class="flex items-center justify-center gap-3 w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-medium py-2.5 rounded-lg transition-colors"
        >
          <svg class="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          Sign in with Google
        </a>


        <button
          type="button"
          @click="demoLogin"
          :disabled="loading"
          class="flex items-center justify-center gap-2 w-full bg-emerald-700 hover:bg-emerald-600 border border-emerald-600 text-white font-medium py-2.5 rounded-lg transition-colors mt-2"
        >
          ⚡ Skip Sign In — Demo Mode (Pro)
        </button>

        <p class="text-center text-sm text-slate-500 mt-6">
          Don't have an account?
          <RouterLink to="/register" class="text-war-orange hover:underline">Register</RouterLink>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth = useAuthStore()

const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)
const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8787'

async function submit() {
  error.value = ''
  loading.value = true
  try {
    const user = await auth.login(email.value, password.value)
    router.push(user.tier === 'pro' ? '/pro' : '/dashboard')
  } catch (e: any) {
    error.value = e.response?.data?.error || 'Invalid email or password'
  } finally {
    loading.value = false
  }
}

async function demoLogin() {
  loading.value = true
  error.value = ''
  try {
    const res = await fetch(`${apiBase}/auth/demo`)
    const data = await res.json()
    localStorage.setItem('wardash_token', data.token)
    auth.token = data.token
    await auth.fetchMe()
    router.push('/pro')
  } catch (e: any) {
    error.value = 'Demo login failed'
  } finally {
    loading.value = false
  }
}
</script>
