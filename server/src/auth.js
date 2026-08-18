import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const COOKIE = 'tripduty_session'
const SECRET = process.env.JWT_SECRET
const MAX_AGE_DAYS = 90

if (!SECRET) throw new Error('JWT_SECRET manquant')

export async function hashPassword(password) {
  return bcrypt.hash(password, 12)
}

export async function checkPassword(password, hash) {
  return bcrypt.compare(password, hash)
}

export function setSession(req, res, accountId) {
  const token = jwt.sign({ sub: accountId }, SECRET, { expiresIn: `${MAX_AGE_DAYS}d` })
  res.cookie(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    // Secure des que la connexion est en HTTPS. nginx redirige tout le trafic
    // vers HTTPS une fois le certificat en place, donc en pratique toujours.
    secure: req.secure,
    maxAge: MAX_AGE_DAYS * 24 * 60 * 60 * 1000,
    path: '/',
  })
}

export function clearSession(res) {
  res.clearCookie(COOKIE, { path: '/' })
}

/** Lit la session. Le mot de passe ne circule jamais au-dela de la connexion. */
export function requireAuth(req, res, next) {
  const token = req.cookies?.[COOKIE]
  if (!token) return res.status(401).json({ error: 'notSignedIn' })
  try {
    const payload = jwt.verify(token, SECRET)
    req.accountId = payload.sub
    next()
  } catch {
    return res.status(401).json({ error: 'notSignedIn' })
  }
}
