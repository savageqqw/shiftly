<script setup>
import { onMounted, ref } from 'vue'
import { useAuthStore } from './stores/auth.js'
import AppSidebar from './components/AppSidebar.vue'
import ToastHost from './components/ToastHost.vue'

const auth = useAuthStore()
const booting = ref(true)

onMounted(async () => {
  await auth.bootstrap()
  booting.value = false
})
</script>

<template>
  <div v-if="booting" class="boot-screen">
    <div class="boot-mark mono">⌗</div>
  </div>
  <template v-else>
    <div v-if="auth.isAuthed" class="shell">
      <AppSidebar />
      <main class="main">
        <RouterView />
      </main>
    </div>
    <RouterView v-else />
  </template>
  <ToastHost />
</template>

<style scoped>
.boot-screen {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}
.boot-mark {
  font-size: 24px;
  color: var(--text-faint);
  animation: pulse 1.4s ease-in-out infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.9; }
}

.shell {
  display: flex;
  min-height: 100vh;
}
.main {
  flex: 1;
  min-width: 0;
  padding: 32px 40px;
}

@media (max-width: 860px) {
  .shell { flex-direction: column; }
  .main { padding: 20px; }
}
</style>
