import { createClient } from '@libsql/client'

let client
let migrated

export function db() {
  if (!client) {
    client = createClient({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN
    })
  }
  return client
}

// Batched, idempotent migration — checked once per cold start, all statements
// run together instead of sequential ALTERs.
export async function migrate() {
  if (migrated) return
  const c = db()
  await c.batch([
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS settings (
      user_id INTEGER PRIMARY KEY REFERENCES users(id),
      work_days INTEGER NOT NULL DEFAULT 5,
      rest_days INTEGER NOT NULL DEFAULT 2,
      anchor_date TEXT NOT NULL,
      shift_default_start TEXT NOT NULL DEFAULT '09:00',
      shift_default_end TEXT NOT NULL DEFAULT '18:00',
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS shifts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      date TEXT NOT NULL,
      override INTEGER,
      start_time TEXT,
      end_time TEXT,
      hours REAL,
      trade_in_count INTEGER,
      note TEXT,
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(user_id, date)
    )`,
    `CREATE INDEX IF NOT EXISTS idx_shifts_user_date ON shifts(user_id, date)`
  ], 'write')
  migrated = true
}
