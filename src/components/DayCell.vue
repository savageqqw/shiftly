<script setup>
import { computed } from 'vue'
import { toISODate, isPatternWorkDay, effectiveIsWorking } from '../lib/schedule.js'

const props = defineProps({
  date: { type: Date, required: true },
  inMonth: { type: Boolean, default: true },
  isToday: { type: Boolean, default: false },
  settings: { type: Object, default: null },
  shift: { type: Object, default: null }
})
const emit = defineEmits(['open'])

const dateStr = computed(() => toISODate(props.date))
const patternWork = computed(() => isPatternWorkDay(dateStr.value, props.settings))
const override = computed(() => props.shift?.override)
const working = computed(() => effectiveIsWorking(dateStr.value, props.settings, override.value))
const isDeviation = computed(() => override.value === 0 || override.value === 1)
</script>

<template>
  <button
    type="button"
    class="cell"
    :class="{ 'out-month': !inMonth, today: isToday, working, off: !working, deviation: isDeviation }"
    @click="emit('open', dateStr)"
  >
    <div class="cell-top">
      <span class="cell-num mono">{{ date.getDate() }}</span>
      <span class="status-mark" :class="{ filled: working }" :title="working ? 'робочий' : 'вихідний'" />
    </div>

    <div class="cell-body" v-if="inMonth">
      <span v-if="shift?.hours != null" class="cell-hours mono">{{ shift.hours }}г</span>
      <span v-if="shift?.trade_in_count != null" class="cell-tradein mono">▤ {{ shift.trade_in_count }}</span>
    </div>

    <span v-if="isDeviation && inMonth" class="deviation-flag" title="заміна графіка">⌁</span>
  </button>
</template>

<style scoped>
.cell {
  position: relative;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-s);
  padding: 8px;
  min-height: 78px;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  text-align: left;
  color: var(--text);
  transition: background 0.12s var(--ease), border-color 0.12s var(--ease);
}
.cell:hover { background: var(--surface-2); border-color: var(--border-strong); }
.cell.out-month { opacity: 0.32; }
.cell.today { border-color: var(--text); }

.cell.working {
  background: rgba(34, 197, 94, 0.10);
  border-color: rgba(34, 197, 94, 0.35);
}
.cell.working:hover { background: rgba(34, 197, 94, 0.16); border-color: rgba(34, 197, 94, 0.5); }
.cell.today.working { border-color: rgba(34, 197, 94, 0.8); }

.cell.off {
  background: rgba(239, 68, 68, 0.08);
  border-color: rgba(239, 68, 68, 0.28);
}
.cell.off:hover { background: rgba(239, 68, 68, 0.14); border-color: rgba(239, 68, 68, 0.45); }
.cell.today.off { border-color: rgba(239, 68, 68, 0.8); }

.cell-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}
.cell-num { font-size: 12.5px; color: var(--text-dim); }
.cell.today .cell-num { color: var(--text); font-weight: 600; }

.status-mark {
  width: 8px; height: 8px;
  border: 1.5px solid rgba(239, 68, 68, 0.65);
  border-radius: 1px;
  flex-shrink: 0;
}
.status-mark.filled { background: rgba(34, 197, 94, 0.85); border-color: rgba(34, 197, 94, 0.85); }

.cell-body {
  display: flex;
  flex-direction: column;
  gap: 3px;
  font-size: 11px;
  color: var(--text-dim);
}

.deviation-flag {
  position: absolute;
  top: 6px;
  right: 8px;
  font-size: 10px;
  color: var(--text-faint);
}

@media (max-width: 700px) {
  .cell { min-height: 56px; padding: 6px; }
  .cell-body { font-size: 10px; }
}
</style>
