import { db, migrate } from './_db.js'
import { requireUser } from './_auth.js'

export default async function handler(req, res) {
  const uid = requireUser(req, res)
  if (!uid) return
  const action = req.query.action

  try {
    await migrate()
    if (action === 'get' && req.method === 'GET') {
      const r = await db().execute({ sql: 'SELECT * FROM settings WHERE user_id = ?', args: [uid] })
      if (!r.rows[0]) {
        const anchor = new Date().toISOString().slice(0, 10)
        await db().execute({ sql: 'INSERT INTO settings (user_id, anchor_date) VALUES (?, ?)', args: [uid, anchor] })
        const r2 = await db().execute({ sql: 'SELECT * FROM settings WHERE user_id = ?', args: [uid] })
        return res.status(200).json(r2.rows[0])
      }
      return res.status(200).json(r.rows[0])
    }

    if (action === 'update' && req.method === 'POST') {
      const { work_days, rest_days, anchor_date, shift_default_start, shift_default_end } = req.body || {}
      if (!Number.isInteger(work_days) || !Number.isInteger(rest_days) || work_days < 1 || rest_days < 0) {
        return res.status(400).json({ error: 'Некоректні значення графіка' })
      }
      const r = await db().execute({
        sql: `UPDATE settings SET work_days = ?, rest_days = ?, anchor_date = ?,
              shift_default_start = ?, shift_default_end = ?, updated_at = datetime('now')
              WHERE user_id = ? RETURNING *`,
        args: [work_days, rest_days, anchor_date, shift_default_start || '09:00', shift_default_end || '18:00', uid]
      })
      return res.status(200).json(r.rows[0])
    }

    return res.status(404).json({ error: 'Невідома дія' })
  } catch (e) {
    console.error('settings handler error:', e)
    return res.status(500).json({ error: e.message || 'Внутрішня помилка сервера' })
  }
}
