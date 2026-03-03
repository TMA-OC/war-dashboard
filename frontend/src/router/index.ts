import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/dashboard' },
    { path: '/login', component: () => import('@/views/LoginView.vue') },
    { path: '/register', component: () => import('@/views/RegisterView.vue') },
    {
      path: '/dashboard',
      component: () => import('@/views/DashboardView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/settings',
      component: () => import('@/views/SettingsView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/pro',
      component: () => import('@/views/ProDashboardView.vue'),
      meta: { requiresAuth: true, requiresPro: true },
    },
    {
      path: '/pro/settings',
      component: () => import('@/views/ProSettingsView.vue'),
      meta: { requiresAuth: true, requiresPro: true },
    },
    {
      path: '/broadcast',
      component: () => import('@/views/BroadcastView.vue'),
      meta: { requiresAuth: true, requiresPro: true },
    },
    // Public embed route — no auth required
    {
      path: '/embed',
      component: () => import('@/views/EmbedView.vue'),
      meta: { requiresAuth: false, embed: true },
    },
  ],
})

router.beforeEach(async (to) => {
  // Skip all auth checks for embed route
  if (to.meta.embed) return

  const auth = useAuthStore()

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return '/login'
  }

  if (to.meta.requiresAuth && auth.isAuthenticated && !auth.user) {
    try { await auth.fetchMe() } catch {}
  }

  if (to.meta.requiresPro && !auth.isPro) {
    return '/dashboard'
  }
})

export default router
