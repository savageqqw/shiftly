<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useScheduleStore } from '../stores/schedule.js'
import { monthGrid, toISODate, WEEKDAYS_UK, MONTHS_UK } from '../lib/schedule.js'
import DayCell from '../components/DayCell.vue'
import DayModal from '../components/DayModal.vue'

const schedule = useScheduleStore()

const cursor = ref(new Date(new Date().getFullYear(), new Date().getMonth(), 1))
const openDate = ref(null)
const todayStr = toISODate(new Date())

const grid = computed(() => monthGrid(cursor.value.getFullYear(), cursor.value.getMonth()))
const monthLabel = computed(() => `${MONTHS_UK[cursor.value.getMonth()]} ${cursor.value.getFullYear()}`)

async function loadCurrent() {
  await schedule.loadMonth(cursor.value.getFullYear(), cursor.value.getMonth())
  // Grid can spill into adjacent months at the edges — load those too.
  const first = grid.value[0]
  const last = grid.value[grid.value.length - 1]
  await schedule.loadMonth(first.getFullYear(), first.getMonth())
  await schedule.loadMonth(last.getFullYear(), last.getMonth())
}

onMounted(async () => {
  if (!schedule.settings) await schedule.loadSettings()
  await loadCurrent()
})

watch(cursor, loadCurrent)

function prevMonth() {
  cursor.value = new Date(cursor.value.getFullYear(), cursor.value.getMonth() - 1, 1)
}
function nextMonth() {
  cursor.value = new Date(cursor.value.getFullYear(), cursor.value.getMonth() + 1, 1)
}
function goToday() {
  cursor.value = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
}

const monthSummary = computed(() => {
  let hours = 0
  let tradeIn = 0
  let shiftsLogged = 0
  const monthKey = `${cursor.value.getFullYear()}-${String(cursor.value.getMonth() + 1).padStart(2, '0')}`
  for (const [date, row] of Object.entries(schedule.shifts)) {
    if (!date.startsWith(monthKey)) continue
    if (row.hours != null) { hours += row.hours; shiftsLogged++ }
    if (row.trade_in_count != null) tradeIn += row.trade_in_count
  }
  return { hours: Math.round(hours * 100) / 100, tradeIn, shiftsLogged }
})
</script>

<template>
  <div class="calendar-view">
    <header class="view-header">
      <div>
        <h1 class="view-title">Графік</h1>
        <p class="view-sub">Натисніть на день, щоб внести години або замінити зміну</p>
      </div>
      <div class="month-nav">
        <button class="btn btn-ghost" @click="prevMonth" aria-label="Попередній місяць">←</button>
        <span class="month-label mono" @click="goToday">{{ monthLabel }}</span>
        <button class="btn btn-ghost" @click="nextMonth" aria-label="Наступний місяць">→</button>
      </div>
    </header>

    <div class="legend">
      <span class="legend-item"><span class="legend-dot legend-work" /> робочий</span>
      <span class="legend-item"><span class="legend-dot legend-off" /> вихідний</span>
      <span class="legend-item"><span class="legend-mark">⌁</span> заміна графіка</span>
    </div>

    <div class="summary-strip">
      <div class="summary-item">
        <span class="summary-value mono">{{ monthSummary.hours }}</span>
        <span class="summary-label">год цього місяця</span>
      </div>
      <div class="summary-item">
        <span class="summary-value mono">{{ monthSummary.shiftsLogged }}</span>
        <span class="summary-label">відпрацьовано змін</span>
      </div>
      <div class="summary-item">
        <span class="summary-value mono">{{ monthSummary.tradeIn }}</span>
        <span class="summary-label">одиниць товару</span>
      </div>
    </div>

    <div class="weekday-row">
      <span v-for="w in WEEKDAYS_UK" :key="w" class="weekday mono">{{ w }}</span>
    </div>

    <div class="grid">
      <DayCell
        v-for="d in grid"
        :key="d.toISOString()"
        :date="d"
        :in-month="d.getMonth() === cursor.getMonth()"
        :is-today="toISODate(d) === todayStr"
        :settings="schedule.settings"
        :shift="schedule.getShift(toISODate(d))"
        @open="openDate = $event"
      />
    </div>

    <DayModal v-if="openDate" :date="openDate" @close="openDate = null" />
  </div>
</template>

<style scoped>
.view-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 14px;
}
.view-title { font-size: 21px; font-weight: 600; margin: 0 0 4px; letter-spacing: -0.01em; }
.view-sub { font-size: 13px; color: var(--text-dim); margin: 0; }

.month-nav {
  display: flex;
  align-items: center;
  gap: 4px;
}
.month-label {
  font-size: 13px;
  color: var(--text);
  padding: 0 10px;
  min-width: 150px;
  text-align: center;
  cursor: pointer;
  text-transform: capitalize;
}

.legend {
  display: flex;
  gap: 18px;
  margin-bottom: 18px;
  font-size: 12px;
  color: var(--text-dim);
}
.legend-item { display: inline-flex; align-items: center; gap: 6px; }
.legend-dot { width: 8px; height: 8px; border-radius: 1px; display: inline-block; }
.legend-work { background: rgba(34, 197, 94, 0.85); }
.legend-off { border: 1.5px solid rgba(239, 68, 68, 0.65); }
.legend-mark { color: var(--text-faint); font-size: 11px; }

.summary-strip {
  display: flex;
  gap: 1px;
  background: var(--border);
  border: 1px solid var(--border);
  border-radius: var(--radius-m);
  overflow: hidden;
  margin-bottom: 24px;
}
.summary-item {
  flex: 1;
  background: var(--surface);
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.summary-value { font-size: 20px; font-weight: 600; }
.summary-label { font-size: 11.5px; color: var(--text-dim); }

.weekday-row {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8px;
  margin-bottom: 8px;
}
.weekday {
  font-size: 11px;
  color: var(--text-faint);
  text-align: center;
}

.grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8px;
}

@media (max-width: 700px) {
  .summary-strip { flex-direction: column; }
  .grid, .weekday-row { gap: 5px; }
}
</style>
