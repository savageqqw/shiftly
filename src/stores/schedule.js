import { defineStore } from 'pinia'
import { api } from '../lib/api.js'
import { toISODate } from '../lib/schedule.js'
import { useToastStore } from './toast.js'

export const useScheduleStore = defineStore('schedule', {
  state: () => ({
    settings: null,
    shifts: {}, // date string -> shift row
    loadedMonths: new Set(), // 'YYYY-M'
    settingsLoading: false,
    monthLoading: false
  }),
  actions: {
    async loadSettings() {
      this.settingsLoading = true
      try {
        this.settings = await api.getSettings()
      } catch (e) {
        useToastStore().error('Не вдалося завантажити налаштування графіка')
      } finally {
        this.settingsLoading = false
      }
    },

    async updateSettings(payload) {
      const prev = this.settings
      this.settings = { ...this.settings, ...payload }
      try {
        this.settings = await api.updateSettings(payload)
        useToastStore().success('Графік оновлено')
      } catch (e) {
        this.settings = prev
        useToastStore().error(e.message || 'Не вдалося оновити графік')
        throw e
      }
    },

    async loadMonth(year, month) {
      const key = `${year}-${month}`
      if (this.loadedMonths.has(key)) return
      this.monthLoading = true
      const from = toISODate(new Date(year, month, 1))
      const to = toISODate(new Date(year, month + 1, 0))
      try {
        const rows = await api.listShifts(from, to)
        for (const row of rows) {
          this.shifts[row.date] = row
        }
        this.loadedMonths.add(key)
      } catch (e) {
        useToastStore().error('Не вдалося завантажити зміни за місяць')
      } finally {
        this.monthLoading = false
      }
    },

    getShift(date) {
      return this.shifts[date] || null
    },

    async saveDay(date, payload) {
      const prev = this.shifts[date]
      // optimistic merge
      this.shifts[date] = { ...(prev || { date }), ...payload }
      try {
        const saved = await api.upsertShift({ date, ...payload })
        this.shifts[date] = saved
        useToastStore().success('Збережено')
        return saved
      } catch (e) {
        if (prev) this.shifts[date] = prev
        else delete this.shifts[date]
        useToastStore().error(e.message || 'Не вдалося зберегти зміну')
        throw e
      }
    },

    async clearDay(date) {
      const prev = this.shifts[date]
      delete this.shifts[date]
      try {
        await api.deleteShift(date)
        useToastStore().success('Скинуто до типового графіка')
      } catch (e) {
        if (prev) this.shifts[date] = prev
        useToastStore().error(e.message || 'Не вдалося скинути день')
        throw e
      }
    }
  }
})
