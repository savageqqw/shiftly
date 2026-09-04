import { defineStore } from 'pinia'
import { api, getToken, setToken } from '../lib/api.js'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    hasUser: null, // whether any account exists on the server at all
    ready: false
  }),
  getters: {
    isAuthed: (s) => !!s.user
  },
  actions: {
    async bootstrap() {
      try {
        const status = await api.authStatus()
        this.hasUser = status.hasUser
      } catch {
        this.hasUser = null
      }
      if (getToken()) {
        try {
          this.user = await api.me()
        } catch {
          setToken(null)
          this.user = null
        }
      }
      this.ready = true
    },
    async setup(email, password) {
      const { token } = await api.setup(email, password)
      setToken(token)
      this.user = await api.me()
      this.hasUser = true
    },
    async login(email, password) {
      const { token } = await api.login(email, password)
      setToken(token)
      this.user = await api.me()
    },
    logout() {
      setToken(null)
      this.user = null
    }
  }
})
