<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useScheduleStore } from '../stores/schedule.js'
import { useAuthStore } from '../stores/auth.js'

const schedule = useScheduleStore()
const auth = useAuthStore()

const workDays = ref(5)
const restDays = ref(2)
const anchorDate = ref('')
const defaultStart = ref('09:00')
const defaultEnd = ref('18:00')
const saving = ref(false)

function syncFromStore() {
  if (!schedule.settings) return
  workDays.value = schedule.settings.work_days
  restDays.value = schedule.settings.rest_days
  anchorDate.value = schedule.settings.anchor_date
  defaultStart.value = schedule.settings.shift_default_start
  defaultEnd.value = schedule.settings.shift_default_end
}

onMounted(async () => {
  if (!schedule.settings) await schedule.loadSettings()
  syncFromStore()
})
watch(() => schedule.settings, syncFromStore)

const cycleLabel = computed(() => `${workDays.value}/${restDays.value}`)

async function save() {
  saving.value = true
  try {
    await schedule.updateSettings({
      work_days: Number(workDays.value),
      rest_days: Number(restDays.value),
      anchor_date: anchorDate.value,
      shift_default_start: defaultStart.value,
      shift_default_end: defaultEnd.value
    })
  } catch {
    // toast handled in store
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="settings-view">
    <header class="view-header">
      <h1 class="view-title">Налаштування</h1>
      <p class="view-sub">Базовий графік застосовується автоматично; окремі дні можна змінити прямо в календарі</p>
    </header>

    <div class="card settings-card">
      <h2 class="section-title">Базовий графік</h2>
      <div class="row-2">
        <div class="field">
          <label for="work">Робочих днів поспіль</label>
          <input id="work" v-model="workDays" type="number" min="1" max="30" />
        </div>
        <div class="field">
          <label for="rest">Вихідних днів поспіль</label>
          <input id="rest" v-model="restDays" type="number" min="0" max="30" />
        </div>
      </div>
      <div class="field">
        <label for="anchor">Відлік циклу почати з дати</label>
        <input id="anchor" v-model="anchorDate" type="date" />
      </div>
      <p class="hint">
        Цикл {{ cycleLabel }} — {{ workDays }} робочих, потім {{ restDays }} вихідних, і так по колу від обраної дати.
        Такий день у календарі можна вручну зробити робочим або вихідним для заміни.
      </p>

      <h2 class="section-title">Типовий час зміни</h2>
      <div class="row-2">
        <div class="field">
          <label for="ds">З</label>
          <input id="ds" v-model="defaultStart" type="time" />
        </div>
        <div class="field">
          <label for="de">До</label>
          <input id="de" v-model="defaultEnd" type="time" />
        </div>
      </div>
      <p class="hint">Ці значення підставляються за замовчуванням при відкритті робочого дня — їх завжди можна змінити вручну.</p>

      <button class="btn btn-primary" :disabled="saving" @click="save">{{ saving ? 'Збереження…' : 'Зберегти зміни' }}</button>
    </div>

    <div class="card settings-card">
      <h2 class="section-title">Обліковий запис</h2>
      <p class="hint mono">{{ auth.user?.email }}</p>
    </div>
  </div>
</template>

<style scoped>
.view-header { margin-bottom: 24px; }
.view-title { font-size: 21px; font-weight: 600; margin: 0 0 4px; letter-spacing: -0.01em; }
.view-sub { font-size: 13px; color: var(--text-dim); margin: 0; max-width: 480px; }

.settings-card {
  padding: 22px;
  max-width: 480px;
  margin-bottom: 16px;
}
.section-title {
  font-size: 13.5px;
  font-weight: 600;
  margin: 0 0 16px;
}
.settings-card .section-title:not(:first-child) { margin-top: 22px; }

.row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

.hint {
  font-size: 12px;
  color: var(--text-faint);
  line-height: 1.6;
  margin: 0 0 18px;
}
</style>
