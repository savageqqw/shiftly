import bcrypt from 'bcryptjs'
import { db, migrate } from './_db.js'
import { signToken, getUserId } from './_auth.js'

export default async function handler(req, res) {
  await migrate()
  const action = req.query.action

  if (action === 'status' && req.method === 'GET') {
    const r = await db().execute('SELECT COUNT(*) as c FROM users')
    return res.status(200).json({ hasUser: Number(r.rows[0].c) > 0 })
  }

  if (action === 'setup' && req.method === 'POST') {
    const r = await db().execute('SELECT COUNT(*) as c FROM users')
    if (Number(r.rows[0].c) > 0) {
      return res.status(409).json({ error: 'Обліковий запис вже створено' })
    }
    const { email, password } = req.body || {}
    if (!email || !password || password.length < 6) {
      return res.status(400).json({ error: 'Пароль має містити щонайменше 6 символів' })
    }
    const hash = await bcrypt.hash(password, 10)
    const anchor = new Date().toISOString().slice(0, 10)
    const insert = await db().execute({
      sql: 'INSERT INTO users (email, password_hash) VALUES (?, ?) RETURNING id',
      args: [email.trim().toLowerCase(), hash]
    })
    const userId = insert.rows[0].id
    await db().execute({
      sql: 'INSERT INTO settings (user_id, anchor_date) VALUES (?, ?)',
      args: [userId, anchor]
    })
    const token = signToken(userId)
    return res.status(200).json({ token })
  }

  if (action === 'login' && req.method === 'POST') {
    const { email, password } = req.body || {}
    const r = await db().execute({
      sql: 'SELECT id, password_hash FROM users WHERE email = ?',
      args: [(email || '').trim().toLowerCase()]
    })
    const user = r.rows[0]
    if (!user) return res.status(401).json({ error: 'Невірний email або пароль' })
    const ok = await bcrypt.compare(password || '', user.password_hash)
    if (!ok) return res.status(401).json({ error: 'Невірний email або пароль' })
    const token = signToken(user.id)
    return res.status(200).json({ token })
  }

  if (action === 'me' && req.method === 'GET') {
    const uid = getUserId(req)
    if (!uid) return res.status(401).json({ error: 'Потрібна авторизація' })
    const r = await db().execute({ sql: 'SELECT id, email FROM users WHERE id = ?', args: [uid] })
    if (!r.rows[0]) return res.status(401).json({ error: 'Потрібна авторизація' })
    return res.status(200).json({ id: r.rows[0].id, email: r.rows[0].email })
  }

  return res.status(404).json({ error: 'Невідома дія' })
}
