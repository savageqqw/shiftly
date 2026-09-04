import jwt from 'jsonwebtoken'

const SECRET = process.env.JWT_SECRET || 'dev-secret-change-me'

export function signToken(userId) {
  return jwt.sign({ uid: userId }, SECRET, { expiresIn: '90d' })
}

export function getUserId(req) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) return null
  try {
    const payload = jwt.verify(token, SECRET)
    return payload.uid
  } catch {
    return null
  }
}

export function requireUser(req, res) {
  const uid = getUserId(req)
  if (!uid) {
    res.status(401).json({ error: 'Потрібна авторизація' })
    return null
  }
  return uid
}
