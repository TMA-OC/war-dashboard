<template>
  <header class="bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between">
    <div class="flex items-center gap-3">
      <span class="font-bold text-lg text-war-red tracking-wider">WAR DASHBOARD</span>
      <span class="text-xs text-slate-500 uppercase tracking-widest">Intelligence</span>
    </div>
    <nav class="flex items-center gap-4">
      <RouterLink to="/dashboard" class="text-sm text-slate-400 hover:text-white transition-colors">Feed</RouterLink>
      <RouterLink v-if="auth.isPro" to="/pro" class="text-sm text-slate-400 hover:text-white transition-colors">Pro</RouterLink>
      <RouterLink v-if="auth.isPro" to="/broadcast" class="text-sm text-slate-400 hover:text-white transition-colors">Broadcast</RouterLink>
      <RouterLink to="/settings" class="text-sm text-slate-400 hover:text-white transition-colors">Settings</RouterLink>
      <button @click="auth.logout(); router.push('/login')" class="text-sm text-slate-500 hover:text-war-red transition-colors">Logout</button>
    </nav>
  </header>
</template>

<script setup lang="ts">
import { RouterLink, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()
</script>
