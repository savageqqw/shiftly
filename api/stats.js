import { db, migrate } from './_db.js'
import { requireUser } from './_auth.js'

export default async function handler(req, res) {
  const uid = requireUser(req, res)
  if (!uid) return
  const action = req.query.action

  try {
    await migrate()
    if (action === 'summary' && req.method === 'GET') {
      const { from, to } = req.query
      const r = await db().execute({
        sql: `SELECT
                COUNT(*) FILTER (WHERE hours IS NOT NULL) as shifts_logged,
                COALESCE(SUM(hours), 0) as total_hours,
                COALESCE(SUM(trade_in_count), 0) as total_trade_in,
                COALESCE(AVG(hours), 0) as avg_hours
              FROM shifts
              WHERE user_id = ? AND date >= ? AND date <= ?`,
        args: [uid, from, to]
      })
      const row = r.rows[0]

      const weekly = await db().execute({
        sql: `SELECT strftime('%Y-%W', date) as week, SUM(hours) as hours, SUM(trade_in_count) as trade_in
              FROM shifts WHERE user_id = ? AND date >= ? AND date <= ? AND hours IS NOT NULL
              GROUP BY week ORDER BY week ASC`,
        args: [uid, from, to]
      })

      return res.status(200).json({
        shifts_logged: Number(row.shifts_logged),
        total_hours: Number(row.total_hours),
        total_trade_in: Number(row.total_trade_in),
        avg_hours: Number(row.avg_hours),
        weekly: weekly.rows
      })
    }

    return res.status(404).json({ error: 'Невідома дія' })
  } catch (e) {
    console.error('stats handler error:', e)
    return res.status(500).json({ error: e.message || 'Внутрішня помилка сервера' })
  }
}
