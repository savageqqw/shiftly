import { db, migrate } from './_db.js'
import { requireUser } from './_auth.js'

function computeHours(start, end) {
  if (!start || !end) return null
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  let mins = (eh * 60 + em) - (sh * 60 + sm)
  if (mins <= 0) mins += 24 * 60 // overnight shift
  return Math.round((mins / 60) * 100) / 100
}

export default async function handler(req, res) {
  const uid = requireUser(req, res)
  if (!uid) return
  const action = req.query.action

  try {
    await migrate()
    if (action === 'list' && req.method === 'GET') {
      const { from, to } = req.query
      const r = await db().execute({
        sql: 'SELECT * FROM shifts WHERE user_id = ? AND date >= ? AND date <= ? ORDER BY date ASC',
        args: [uid, from, to]
      })
      return res.status(200).json(r.rows)
    }

    if (action === 'upsert' && req.method === 'POST') {
      const { date, override, start_time, end_time, trade_in_count, note } = req.body || {}
      if (!date) return res.status(400).json({ error: 'Дата обов\u2019язкова' })
      const hours = computeHours(start_time, end_time)
      const tradeIn = trade_in_count === '' || trade_in_count === undefined || trade_in_count === null
        ? null
        : Number(trade_in_count)
      const r = await db().execute({
        sql: `INSERT INTO shifts (user_id, date, override, start_time, end_time, hours, trade_in_count, note, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
              ON CONFLICT(user_id, date) DO UPDATE SET
                override = excluded.override,
                start_time = excluded.start_time,
                end_time = excluded.end_time,
                hours = excluded.hours,
                trade_in_count = excluded.trade_in_count,
                note = excluded.note,
                updated_at = datetime('now')
              RETURNING *`,
        args: [uid, date, override ?? null, start_time || null, end_time || null, hours, tradeIn, note || null]
      })
      return res.status(200).json(r.rows[0])
    }

    if (action === 'delete' && req.method === 'POST') {
      const { date } = req.body || {}
      if (!date) return res.status(400).json({ error: 'Дата обов\u2019язкова' })
      await db().execute({ sql: 'DELETE FROM shifts WHERE user_id = ? AND date = ?', args: [uid, date] })
      return res.status(200).json({ ok: true })
    }

    return res.status(404).json({ error: 'Невідома дія' })
  } catch (e) {
    console.error('shifts handler error:', e)
    return res.status(500).json({ error: e.message || 'Внутрішня помилка сервера' })
  }
}
