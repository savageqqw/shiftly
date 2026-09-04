import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'

const routes = [
  { path: '/', name: 'calendar', component: () => import('../views/CalendarView.vue') },
  { path: '/stats', name: 'stats', component: () => import('../views/StatsView.vue') },
  { path: '/settings', name: 'settings', component: () => import('../views/SettingsView.vue') },
  { path: '/auth', name: 'auth', component: () => import('../views/AuthView.vue') }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (!auth.ready) return true // guarded again after bootstrap in App.vue
  if (to.name !== 'auth' && !auth.isAuthed) {
    return { name: 'auth' }
  }
  if (to.name === 'auth' && auth.isAuthed) {
    return { name: 'calendar' }
  }
  return true
})

export default router
