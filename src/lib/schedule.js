export function toISODate(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function parseISODate(s) {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

// Default working status from the rotation pattern (ignores manual overrides).
export function isPatternWorkDay(dateStr, settings) {
  if (!settings?.anchor_date) return false
  const anchor = parseISODate(settings.anchor_date)
  const date = parseISODate(dateStr)
  const diffDays = Math.round((date - anchor) / 86400000)
  const cycle = settings.work_days + settings.rest_days
  if (cycle <= 0) return false
  const pos = ((diffDays % cycle) + cycle) % cycle
  return pos < settings.work_days
}

// Effective status combining pattern default with a manual per-day override.
// override: null/undefined = use pattern, 1 = forced working, 0 = forced off.
export function effectiveIsWorking(dateStr, settings, override) {
  if (override === 1) return true
  if (override === 0) return false
  return isPatternWorkDay(dateStr, settings)
}

export const WEEKDAYS_UK = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд']
export const MONTHS_UK = [
  'Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень',
  'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень'
]

export function monthGrid(year, month) {
  // month: 0-11. Returns array of Date objects, Mon-start, padded to full weeks.
  const first = new Date(year, month, 1)
  const startOffset = (first.getDay() + 6) % 7 // 0 = Monday
  const gridStart = new Date(year, month, 1 - startOffset)
  const days = []
  for (let i = 0; i < 42; i++) {
    days.push(new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i))
  }
  return days
}

export function startOfWeek(d) {
  const day = (d.getDay() + 6) % 7
  const s = new Date(d)
  s.setDate(d.getDate() - day)
  return s
}

export function startOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}
export function endOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0)
}
