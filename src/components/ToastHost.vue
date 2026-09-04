<script setup>
import { useToastStore } from '../stores/toast.js'
const toast = useToastStore()
</script>

<template>
  <div class="toast-host">
    <transition-group name="toast">
      <div
        v-for="t in toast.items"
        :key="t.id"
        class="toast-item"
        :class="`toast-${t.type}`"
        role="status"
      >
        <span class="toast-dot" />
        <span class="toast-msg">{{ t.message }}</span>
        <button class="toast-close" @click="toast.dismiss(t.id)" aria-label="Закрити">✕</button>
      </div>
    </transition-group>
  </div>
</template>

<style scoped>
.toast-host {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 200;
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-width: 340px;
}
.toast-item {
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--surface-2);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-s);
  padding: 11px 12px;
  font-size: 13px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
}
.toast-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--text-dim);
  flex-shrink: 0;
}
.toast-success .toast-dot { background: var(--text); }
.toast-error .toast-dot { background: var(--text-faint); border: 1px solid var(--text-dim); }
.toast-msg { flex: 1; color: var(--text); }
.toast-close {
  background: none;
  border: none;
  color: var(--text-faint);
  font-size: 11px;
  padding: 2px;
}
.toast-close:hover { color: var(--text); }

.toast-enter-active, .toast-leave-active { transition: all 0.2s var(--ease); }
.toast-enter-from { opacity: 0; transform: translateY(6px); }
.toast-leave-to { opacity: 0; transform: translateX(6px); }
</style>
