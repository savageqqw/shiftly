<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'

const auth = useAuthStore()
const router = useRouter()

const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

onMounted(async () => {
  if (auth.hasUser === null) await auth.bootstrap()
})

const mode = computed(() => (auth.hasUser ? 'login' : 'setup'))

async function submit() {
  error.value = ''
  if (!email.value || !password.value) {
    error.value = 'Заповніть обидва поля'
    return
  }
  loading.value = true
  try {
    if (mode.value === 'setup') {
      await auth.setup(email.value, password.value)
    } else {
      await auth.login(email.value, password.value)
    }
    router.push({ name: 'calendar' })
  } catch (e) {
    error.value = e.message || 'Помилка входу'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="auth-screen">
    <div class="auth-card card">
      <div class="auth-mark mono">⌗</div>
      <h1 class="auth-title">Shiftly</h1>
      <p class="auth-sub">
        {{ mode === 'setup' ? 'Створіть обліковий запис, щоб почати вести графік' : 'Увійдіть, щоб продовжити' }}
      </p>

      <form @submit.prevent="submit">
        <div class="field">
          <label for="email">Email</label>
          <input id="email" v-model="email" type="email" autocomplete="username" placeholder="you@example.com" />
        </div>
        <div class="field">
          <label for="password">Пароль</label>
          <input
            id="password"
            v-model="password"
            type="password"
            :autocomplete="mode === 'setup' ? 'new-password' : 'current-password'"
            placeholder="••••••••"
          />
        </div>

        <p v-if="error" class="auth-error">{{ error }}</p>

        <button type="submit" class="btn btn-primary auth-submit" :disabled="loading">
          {{ loading ? 'Зачекайте…' : (mode === 'setup' ? 'Створити акаунт' : 'Увійти') }}
        </button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.auth-screen {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}
.auth-card {
  width: 100%;
  max-width: 360px;
  padding: 32px;
}
.auth-mark {
  font-size: 22px;
  color: var(--text-dim);
  margin-bottom: 12px;
}
.auth-title {
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 6px;
  letter-spacing: -0.01em;
}
.auth-sub {
  font-size: 13px;
  color: var(--text-dim);
  margin: 0 0 24px;
  line-height: 1.5;
}
.auth-error {
  font-size: 12.5px;
  color: var(--text);
  background: var(--surface-2);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-s);
  padding: 8px 10px;
  margin: 0 0 14px;
}
.auth-submit { width: 100%; margin-top: 6px; }
</style>
