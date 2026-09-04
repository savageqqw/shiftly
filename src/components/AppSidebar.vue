<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'

const route = useRoute()
const auth = useAuthStore()

const now = ref(new Date())
let timer
onMounted(() => { timer = setInterval(() => { now.value = new Date() }, 1000) })
onUnmounted(() => clearInterval(timer))

const pad = (n) => String(n).padStart(2, '0')
</script>

<template>
  <aside class="sidebar">
    <div class="brand">
      <div class="brand-mark">⌗</div>
      <div class="brand-text">
        <div class="brand-name">Shiftly</div>
        <div class="brand-sub">облік змін</div>
      </div>
    </div>

    <div class="clock mono">
      <span class="clock-time">{{ pad(now.getHours()) }}:{{ pad(now.getMinutes()) }}:{{ pad(now.getSeconds()) }}</span>
    </div>

    <nav class="nav">
      <RouterLink to="/" class="nav-item" :class="{ active: route.name === 'calendar' }">
        <span class="nav-indicator" />
        Графік
      </RouterLink>
      <RouterLink to="/stats" class="nav-item" :class="{ active: route.name === 'stats' }">
        <span class="nav-indicator" />
        Статистика
      </RouterLink>
      <RouterLink to="/settings" class="nav-item" :class="{ active: route.name === 'settings' }">
        <span class="nav-indicator" />
        Налаштування
      </RouterLink>
    </nav>

    <div class="sidebar-footer">
      <div class="user-email mono" :title="auth.user?.email">{{ auth.user?.email }}</div>
      <button class="btn btn-ghost logout-btn" @click="auth.logout()">Вийти</button>
    </div>
  </aside>
</template>

<style scoped>
.sidebar {
  width: 220px;
  flex-shrink: 0;
  background: var(--surface);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  padding: 22px 16px;
  height: 100vh;
  position: sticky;
  top: 0;
}

.brand { display: flex; align-items: center; gap: 10px; margin-bottom: 22px; }
.brand-mark {
  width: 30px; height: 30px;
  display: flex; align-items: center; justify-content: center;
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-s);
  font-size: 15px;
  color: var(--text);
}
.brand-name { font-weight: 600; font-size: 15px; letter-spacing: -0.01em; }
.brand-sub { font-size: 11px; color: var(--text-faint); }

.clock {
  font-size: 13px;
  color: var(--text-dim);
  padding: 8px 10px;
  border: 1px solid var(--border);
  border-radius: var(--radius-s);
  margin-bottom: 22px;
  background: var(--surface-2);
}

.nav { display: flex; flex-direction: column; gap: 2px; flex: 1; }
.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 10px;
  border-radius: var(--radius-s);
  color: var(--text-dim);
  text-decoration: none;
  font-size: 13.5px;
  transition: background 0.15s var(--ease), color 0.15s var(--ease);
}
.nav-item:hover { background: var(--surface-2); color: var(--text); }
.nav-item.active { color: var(--text); background: var(--surface-2); }
.nav-indicator {
  width: 5px; height: 5px;
  border-radius: 50%;
  background: var(--border-strong);
  flex-shrink: 0;
}
.nav-item.active .nav-indicator { background: var(--text); }

.sidebar-footer {
  border-top: 1px solid var(--border);
  padding-top: 14px;
  margin-top: 14px;
}
.user-email {
  font-size: 11px;
  color: var(--text-faint);
  margin-bottom: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.logout-btn { width: 100%; font-size: 12.5px; }

@media (max-width: 860px) {
  .sidebar {
    width: 100%;
    height: auto;
    position: relative;
    flex-direction: row;
    align-items: center;
    padding: 12px 16px;
    flex-wrap: wrap;
    gap: 12px;
  }
  .brand { margin-bottom: 0; }
  .clock { display: none; }
  .nav { flex-direction: row; flex: unset; }
  .sidebar-footer {
    border-top: none;
    margin-top: 0;
    padding-top: 0;
    margin-left: auto;
  }
  .user-email { display: none; }
}
</style>
