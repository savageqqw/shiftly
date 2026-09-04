const TOKEN_KEY = 'shiftly_token'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}
export function setToken(t) {
  if (t) localStorage.setItem(TOKEN_KEY, t)
  else localStorage.removeItem(TOKEN_KEY)
}

async function request(path, { method = 'GET', body, query } = {}) {
  let url = `/api/${path}`
  if (query) {
    const qs = new URLSearchParams(query).toString()
    url += `?${url.includes('?') ? '&' : ''}${qs}`.replace('&?', '&')
  }
  const headers = { 'Content-Type': 'application/json' }
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined
  })

  let data = null
  try { data = await res.json() } catch { /* no body */ }

  if (!res.ok) {
    const err = new Error(data?.error || 'Щось пішло не так')
    err.status = res.status
    throw err
  }
  return data
}

export const api = {
  authStatus: () => request('auth', { query: { action: 'status' } }),
  setup: (email, password) => request('auth', { method: 'POST', query: { action: 'setup' }, body: { email, password } }),
  login: (email, password) => request('auth', { method: 'POST', query: { action: 'login' }, body: { email, password } }),
  me: () => request('auth', { query: { action: 'me' } }),

  getSettings: () => request('settings', { query: { action: 'get' } }),
  updateSettings: (payload) => request('settings', { method: 'POST', query: { action: 'update' }, body: payload }),

  listShifts: (from, to) => request('shifts', { query: { action: 'list', from, to } }),
  upsertShift: (payload) => request('shifts', { method: 'POST', query: { action: 'upsert' }, body: payload }),
  deleteShift: (date) => request('shifts', { method: 'POST', query: { action: 'delete' }, body: { date } }),

  summary: (from, to) => request('stats', { query: { action: 'summary', from, to } })
}
