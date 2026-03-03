<template>
  <div class="min-h-screen bg-slate-950 flex items-center justify-center p-4">
    <div class="w-full max-w-md">
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-war-red tracking-wider">WAR DASHBOARD</h1>
        <p class="text-slate-500 text-sm mt-1">Intelligence Platform</p>
      </div>

      <div class="bg-slate-900 border border-slate-800 rounded-xl p-8">
        <h2 class="text-xl font-semibold text-white mb-6">Create Account</h2>

        <form @submit.prevent="submit" class="space-y-4">
          <div>
            <label class="block text-sm text-slate-400 mb-1">Full Name</label>
            <input v-model="name" type="text" required class="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-war-orange transition-colors" placeholder="John Doe" />
          </div>
          <div>
            <label class="block text-sm text-slate-400 mb-1">Email</label>
            <input v-model="email" type="email" required class="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-war-orange transition-colors" placeholder="you@example.com" />
          </div>
          <div>
            <label class="block text-sm text-slate-400 mb-1">Password</label>
            <input v-model="password" type="password" required minlength="8" class="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-war-orange transition-colors" placeholder="Min 8 characters" />
          </div>
          <div>
            <label class="block text-sm text-slate-400 mb-2">Account Type</label>
            <div class="grid grid-cols-2 gap-3">
              <label
                v-for="t in tiers"
                :key="t.value"
                :class="['flex flex-col gap-1 p-3 rounded-lg border cursor-pointer transition-all', tier === t.value ? 'border-war-orange bg-orange-950/20' : 'border-slate-700 bg-slate-800 hover:border-slate-600']"
              >
                <input type="radio" v-model="tier" :value="t.value" class="hidden" />
                <span class="font-medium text-sm text-white">{{ t.label }}</span>
                <span class="text-xs text-slate-400">{{ t.desc }}</span>
              </label>
            </div>
          </div>

          <div v-if="error" class="text-war-red text-sm bg-red-950/40 border border-red-900/50 rounded-lg px-3 py-2">
            {{ error }}
          </div>

          <button type="submit" :disabled="loading" class="w-full bg-war-red hover:bg-red-600 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition-colors">
            {{ loading ? 'Creating account...' : 'Create Account' }}
          </button>
        </form>

        <p class="text-center text-sm text-slate-500 mt-6">
          Already have an account?
          <RouterLink to="/login" class="text-war-orange hover:underline">Sign in</RouterLink>
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

const name = ref('')
const email = ref('')
const password = ref('')
const tier = ref('individual')
const error = ref('')
const loading = ref(false)

const tiers = [
  { value: 'individual', label: 'Individual', desc: 'Personal monitoring & alerts' },
  { value: 'pro', label: 'Pro', desc: 'Broadcast-ready, full analytics' },
]

async function submit() {
  error.value = ''
  loading.value = true
  try {
    const user = await auth.register(name.value, email.value, password.value, tier.value)
    router.push(user.tier === 'pro' ? '/pro' : '/dashboard')
  } catch (e: any) {
    error.value = e.response?.data?.error || 'Registration failed. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>
