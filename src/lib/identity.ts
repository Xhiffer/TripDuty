/** Palette des pastilles de profil, utilisee quand la personne n'a pas de photo. */
export const AVATAR_COLORS = [
  '#ff6a3d',
  '#f5b301',
  '#17b877',
  '#3d8bff',
  '#8b5cf6',
  '#ec4899',
  '#0ea5e9',
  '#e11d48',
]

export const GROUP_COLORS = AVATAR_COLORS

export const GROUP_EMOJIS = [
  '⛰️', '🏖️', '🏝️', '🛶', '⛺', '🎿', '🏄', '🚐',
  '🏡', '🎉', '🍻', '❤️', '🌍', '🎸', '🧗', '🚲',
]

export function colorFor(seed: string): string {
  let sum = 0
  for (let i = 0; i < seed.length; i += 1) sum += seed.charCodeAt(i)
  return AVATAR_COLORS[sum % AVATAR_COLORS.length]
}

/** Initiales affichees dans la pastille : premiere lettre du prenom et du nom. */
export function initialsOf(firstName: string, lastName: string): string {
  const a = firstName.trim().charAt(0)
  const b = lastName.trim().charAt(0)
  return (a + b).toUpperCase() || '?'
}

export function fullName(firstName: string, lastName: string): string {
  return [firstName.trim(), lastName.trim()].filter(Boolean).join(' ')
}

/**
 * Empreinte du mot de passe. Le mot de passe lui-meme n'est jamais stocke.
 * Cote serveur, ce sera un vrai hachage lent avec sel ; ici c'est ce que
 * le navigateur sait faire sans dependance.
 */
export async function hashPassword(password: string): Promise<string> {
  const bytes = new TextEncoder().encode(`tripduty:${password}`)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export function isEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

/** Code d'invitation court, lisible, sans caracteres ambigus. */
export function makeInviteCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 6 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('')
}

export function inviteLink(code: string): string {
  const base = `${window.location.origin}${import.meta.env.BASE_URL}`
  return `${base}#/join/${code}`
}

export function ageFrom(birthDate: string): number | null {
  if (!birthDate) return null
  const born = new Date(birthDate + 'T12:00:00')
  if (Number.isNaN(born.getTime())) return null
  const now = new Date()
  let age = now.getFullYear() - born.getFullYear()
  const monthDiff = now.getMonth() - born.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < born.getDate())) age -= 1
  return age
}
