<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { api } from '../lib/api.js'
import { toISODate, startOfWeek, startOfMonth, endOfMonth } from '../lib/schedule.js'
import { useToastStore } from '../stores/toast.js'

const toast = useToastStore()
const period = ref('month') // 'week' | 'month' | 'all'
const loading = ref(false)
const data = ref(null)

function rangeFor(p) {
  const today = new Date()
  if (p === 'week') {
    const s = startOfWeek(today)
    const e = new Date(s); e.setDate(s.getDate() + 6)
    return [toISODate(s), toISODate(e)]
  }
  if (p === 'month') {
    return [toISODate(startOfMonth(today)), toISODate(endOfMonth(today))]
  }
  return ['2000-01-01', toISODate(today)]
}

async function load() {
  loading.value = true
  try {
    const [from, to] = rangeFor(period.value)
    data.value = await api.summary(from, to)
  } catch (e) {
    toast.error('Не вдалося завантажити статистику')
  } finally {
    loading.value = false
  }
}

onMounted(load)
watch(period, load)

const maxWeekHours = computed(() => {
  if (!data.value?.weekly?.length) return 0
  return Math.max(...data.value.weekly.map((w) => w.hours || 0), 1)
})

const avgTradeInPerShift = computed(() => {
  if (!data.value || !data.value.shifts_logged) return 0
  return Math.round((data.value.total_trade_in / data.value.shifts_logged) * 10) / 10
})
</script>

<template>
  <div class="stats-view">
    <header class="view-header">
      <div>
        <h1 class="view-title">Статистика</h1>
        <p class="view-sub">Підсумки відпрацьованого часу та товару на трейд-ін</p>
      </div>
      <div class="segmented period-switch">
        <button type="button" class="seg-btn" :class="{ active: period === 'week' }" @click="period = 'week'">Тиждень</button>
        <button type="button" class="seg-btn" :class="{ active: period === 'month' }" @click="period = 'month'">Місяць</button>
        <button type="button" class="seg-btn" :class="{ active: period === 'all' }" @click="period = 'all'">Весь час</button>
      </div>
    </header>

    <div v-if="data" class="stat-grid">
      <div class="stat-card card">
        <span class="stat-label">Всього годин</span>
        <span class="stat-value mono">{{ data.total_hours }}</span>
      </div>
      <div class="stat-card card">
        <span class="stat-label">Відпрацьовано змін</span>
        <span class="stat-value mono">{{ data.shifts_logged }}</span>
      </div>
      <div class="stat-card card">
        <span class="stat-label">Середня зміна</span>
        <span class="stat-value mono">{{ Math.round(data.avg_hours * 10) / 10 }}г</span>
      </div>
      <div class="stat-card card">
        <span class="stat-label">Товару на трейд-ін</span>
        <span class="stat-value mono">{{ data.total_trade_in }}</span>
      </div>
      <div class="stat-card card">
        <span class="stat-label">В середньому за зміну</span>
        <span class="stat-value mono">{{ avgTradeInPerShift }} од.</span>
      </div>
    </div>

    <div v-if="data?.weekly?.length" class="chart-card card">
      <div class="chart-title">Години за тижнями</div>
      <div class="bar-chart">
        <div v-for="w in data.weekly" :key="w.week" class="bar-col">
          <div class="bar-track">
            <div class="bar-fill" :style="{ height: `${((w.hours || 0) / maxWeekHours) * 100}%` }" />
          </div>
          <span class="bar-value mono">{{ w.hours || 0 }}</span>
        </div>
      </div>
    </div>

    <div v-else-if="!loading" class="empty-state card">
      За цей період ще немає відпрацьованих змін.
    </div>
  </div>
</template>

<style scoped>
.view-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 14px;
}
.view-title { font-size: 21px; font-weight: 600; margin: 0 0 4px; letter-spacing: -0.01em; }
.view-sub { font-size: 13px; color: var(--text-dim); margin: 0; }

.segmented {
  display: flex;
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-s);
  overflow: hidden;
}
.seg-btn {
  background: var(--surface);
  border: none;
  border-right: 1px solid var(--border-strong);
  color: var(--text-dim);
  padding: 8px 14px;
  font-size: 12.5px;
  font-family: var(--font-ui);
}
.seg-btn:last-child { border-right: none; }
.seg-btn:hover { background: var(--surface-2); color: var(--text); }
.seg-btn.active { background: var(--text); color: var(--bg); font-weight: 600; }

.stat-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 10px;
  margin-bottom: 24px;
}
.stat-card {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.stat-label { font-size: 11.5px; color: var(--text-dim); }
.stat-value { font-size: 24px; font-weight: 600; }

.chart-card { padding: 20px; }
.chart-title { font-size: 13px; color: var(--text-dim); margin-bottom: 18px; }

.bar-chart {
  display: flex;
  align-items: flex-end;
  gap: 10px;
  height: 160px;
}
.bar-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  height: 100%;
  gap: 8px;
}
.bar-track {
  width: 100%;
  flex: 1;
  display: flex;
  align-items: flex-end;
  background: var(--surface-2);
  border-radius: var(--radius-s);
  overflow: hidden;
}
.bar-fill {
  width: 100%;
  background: var(--text);
  min-height: 2px;
  transition: height 0.3s var(--ease);
}
.bar-value { font-size: 10.5px; color: var(--text-faint); }

.empty-state {
  padding: 32px;
  text-align: center;
  color: var(--text-dim);
  font-size: 13.5px;
}
</style>
