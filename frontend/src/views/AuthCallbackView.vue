<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-950 text-white">
    <div class="text-center">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
      <p class="text-gray-400">Signing you in...</p>
      <p v-if="error" class="text-red-400 mt-4">{{ error }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const auth = useAuthStore()
const error = ref('')

onMounted(async () => {
  const params = new URLSearchParams(window.location.search)
  const token = params.get('token')
  const err = params.get('error')

  if (err) {
    error.value = `Sign-in failed: ${err.replace(/_/g, ' ')}`
    setTimeout(() => router.push('/login'), 2500)
    return
  }

  if (!token) {
    error.value = 'No token received'
    setTimeout(() => router.push('/login'), 2500)
    return
  }

  // Store token and fetch user profile
  try {
    await auth.loginWithToken(token)
    router.push('/dashboard')
  } catch {
    error.value = 'Failed to load profile'
    setTimeout(() => router.push('/login'), 2500)
  }
})
</script>
