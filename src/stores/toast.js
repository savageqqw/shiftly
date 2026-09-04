import { defineStore } from 'pinia'

let nextId = 1

export const useToastStore = defineStore('toast', {
  state: () => ({
    items: []
  }),
  actions: {
    push(message, type = 'error', timeout = 4000) {
      const id = nextId++
      this.items.push({ id, message, type })
      if (timeout) {
        setTimeout(() => this.dismiss(id), timeout)
      }
      return id
    },
    error(message) { return this.push(message, 'error') },
    success(message) { return this.push(message, 'success') },
    dismiss(id) {
      this.items = this.items.filter((t) => t.id !== id)
    }
  }
})
