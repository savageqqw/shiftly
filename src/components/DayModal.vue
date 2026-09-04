<script setup>
import { ref, computed, watch } from 'vue'
import { useScheduleStore } from '../stores/schedule.js'
import { parseISODate, isPatternWorkDay, WEEKDAYS_UK, MONTHS_UK } from '../lib/schedule.js'

const props = defineProps({
  date: { type: String, required: true }
})
const emit = defineEmits(['close'])

const schedule = useScheduleStore()

const existing = computed(() => schedule.getShift(props.date))
const patternIsWork = computed(() => isPatternWorkDay(props.date, schedule.settings))

const overrideChoice = ref('auto') // 'auto' | 'work' | 'off'
const startTime = ref('')
const endTime = ref('')
const tradeIn = ref('')
const note = ref('')
const saving = ref(false)

function resetFromExisting() {
  const row = existing.value
  if (row && row.override === 1) overrideChoice.value = 'work'
  else if (row && row.override === 0) overrideChoice.value = 'off'
  else overrideChoice.value = 'auto'

  startTime.value = row?.start_time || schedule.settings?.shift_default_start || '09:00'
  endTime.value = row?.end_time || schedule.settings?.shift_default_end || '18:00'
  tradeIn.value = row?.trade_in_count ?? ''
  note.value = row?.note || ''
}
watch(() => props.date, resetFromExisting, { immediate: true })

const effectiveWorking = computed(() => {
  if (overrideChoice.value === 'work') return true
  if (overrideChoice.value === 'off') return false
  return patternIsWork.value
})

const computedHours = computed(() => {
  if (!effectiveWorking.value || !startTime.value || !endTime.value) return null
  const [sh, sm] = startTime.value.split(':').map(Number)
  const [eh, em] = endTime.value.split(':').map(Number)
  let mins = (eh * 60 + em) - (sh * 60 + sm)
  if (mins <= 0) mins += 24 * 60
  return Math.round((mins / 60) * 100) / 100
})

const dateObj = computed(() => parseISODate(props.date))
const dateLabel = computed(() => {
  const d = dateObj.value
  const weekday = WEEKDAYS_UK[(d.getDay() + 6) % 7]
  return `${weekday}, ${d.getDate()} ${MONTHS_UK[d.getMonth()].toLowerCase()} ${d.getFullYear()}`
})

const isDeviation = computed(() => overrideChoice.value !== 'auto')

async function save() {
  saving.value = true
  try {
    const override = overrideChoice.value === 'work' ? 1 : overrideChoice.value === 'off' ? 0 : null
    await schedule.saveDay(props.date, {
      override,
      start_time: effectiveWorking.value ? startTime.value : null,
      end_time: effectiveWorking.value ? endTime.value : null,
      trade_in_count: effectiveWorking.value && tradeIn.value !== '' ? Number(tradeIn.value) : null,
      note: note.value || null
    })
    emit('close')
  } catch {
    // toast already shown by store
  } finally {
    saving.value = false
  }
}

async function resetDay() {
  saving.value = true
  try {
    await schedule.clearDay(props.date)
    emit('close')
  } catch {
    // toast already shown
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="overlay" @click.self="emit('close')">
    <div class="modal card" role="dialog" aria-modal="true">
      <div class="modal-head">
        <div>
          <div class="modal-date">{{ dateLabel }}</div>
          <div class="modal-tag mono" v-if="isDeviation">заміна графіка</div>
        </div>
        <button class="btn btn-ghost" @click="emit('close')" aria-label="Закрити">✕</button>
      </div>

      <div class="field">
        <label>Статус дня</label>
        <div class="segmented">
          <button
            type="button"
            class="seg-btn"
            :class="{ active: overrideChoice === 'auto' }"
            @click="overrideChoice = 'auto'"
          >
            За графіком
            <span class="seg-hint">{{ patternIsWork ? 'робочий' : 'вихідний' }}</span>
          </button>
          <button
            type="button"
            class="seg-btn seg-work"
            :class="{ active: overrideChoice === 'work' }"
            @click="overrideChoice = 'work'"
          >
            Робочий
          </button>
          <button
            type="button"
            class="seg-btn seg-off"
            :class="{ active: overrideChoice === 'off' }"
            @click="overrideChoice = 'off'"
          >
            Вихідний
          </button>
        </div>
      </div>

      <template v-if="effectiveWorking">
        <div class="row-2">
          <div class="field">
            <label for="start">З</label>
            <input id="start" v-model="startTime" type="time" />
          </div>
          <div class="field">
            <label for="end">До</label>
            <input id="end" v-model="endTime" type="time" />
          </div>
        </div>
        <div class="hours-readout mono" v-if="computedHours !== null">
          Разом: {{ computedHours }} год
        </div>

        <div class="field">
          <label for="tradein">Товару на трейд-ін (шт.)</label>
          <input id="tradein" v-model="tradeIn" type="number" min="0" step="1" placeholder="0" />
        </div>
      </template>

      <div class="field">
        <label for="note">Примітка</label>
        <textarea id="note" v-model="note" rows="2" placeholder="необов'язково"></textarea>
      </div>

      <div class="modal-actions">
        <button v-if="existing" class="btn btn-danger" :disabled="saving" @click="resetDay">Скинути день</button>
        <div class="spacer" />
        <button class="btn btn-ghost" @click="emit('close')">Скасувати</button>
        <button class="btn btn-primary" :disabled="saving" @click="save">{{ saving ? 'Збереження…' : 'Зберегти' }}</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.overlay {
  position: fixed; inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex; align-items: center; justify-content: center;
  padding: 20px;
  z-index: 100;
  animation: fade-in 0.15s var(--ease);
}
@keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }

.modal {
  width: 100%; max-width: 420px;
  padding: 24px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-head {
  display: flex; align-items: flex-start; justify-content: space-between;
  margin-bottom: 18px;
}
.modal-date { font-size: 15.5px; font-weight: 600; }
.modal-tag {
  font-size: 10.5px;
  color: var(--text-faint);
  margin-top: 4px;
  border: 1px solid var(--border);
  display: inline-block;
  padding: 2px 6px;
  border-radius: var(--radius-s);
}

.segmented {
  display: flex;
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-s);
  overflow: hidden;
}
.seg-btn {
  flex: 1;
  background: var(--surface);
  border: none;
  border-right: 1px solid var(--border-strong);
  color: var(--text-dim);
  padding: 10px 6px;
  font-size: 12.5px;
  font-family: var(--font-ui);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  transition: background 0.15s var(--ease), color 0.15s var(--ease);
}
.seg-btn:last-child { border-right: none; }
.seg-btn:hover { background: var(--surface-2); color: var(--text); }
.seg-btn.active { background: var(--text); color: var(--bg); font-weight: 600; }
.seg-work.active { background: rgba(34, 197, 94, 0.85); color: #06210f; }
.seg-off.active { background: rgba(239, 68, 68, 0.85); color: #2a0605; }
.seg-hint { font-size: 10px; color: inherit; opacity: 0.65; }

.row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

.hours-readout {
  font-size: 12.5px;
  color: var(--text-dim);
  margin: -6px 0 14px;
}

textarea {
  background: var(--surface);
  border: 1px solid var(--border-strong);
  color: var(--text);
  padding: 9px 11px;
  border-radius: var(--radius-s);
  font-size: 13px;
  width: 100%;
  resize: vertical;
  font-family: var(--font-ui);
}
textarea:focus { outline: none; border-color: var(--text-dim); }

.modal-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 18px;
  padding-top: 16px;
  border-top: 1px solid var(--border);
}
.spacer { flex: 1; }
</style>
