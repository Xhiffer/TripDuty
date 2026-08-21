/**
 * Les couleurs de pastille.
 *
 * Ce sont des aplats : un degre de plus a lire pour rien, et l'oeil compare
 * mal deux visages quand chacun se fond dans un fond qui bouge.
 *
 * Ce sont des valeurs CSS completes, stockees telles quelles : la base garde
 * une chaine, et un ancien compte enregistre en degrade continue de
 * s'afficher, ramene a plat a la lecture.
 */
export const AVATAR_COLORS = [
  '#ff6f91',
  '#ffae4d',
  '#4fd9a6',
  '#55a9ff',
  '#a87cf6',
  '#f77bc2',
  '#48c9dc',
  '#f45a72',
]

/**
 * Un fond enregistre avant le passage a l'aplat est un degrade a trois tons :
 * on garde celui du milieu, qui porte la couleur.
 */
export function flatColor(value: string | null | undefined): string | undefined {
  if (!value) return undefined
  if (!value.includes('gradient')) return value
  const tones = value.match(/#[0-9a-f]{3,8}/gi)
  if (!tones || tones.length === 0) return undefined
  return tones[Math.floor(tones.length / 2)]
}

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

/**
 * Les groupes crees avant l'emoji ont garde un identifiant d'icone dessinee
 * (« lucide:mountain »). Sans traduction, cet identifiant s'afficherait tel
 * quel en travers de la carte : on le remplace par un emoji neutre.
 */
export function groupEmoji(raw: string | null | undefined): string {
  const value = (raw ?? '').trim()
  if (!value || value.startsWith('lucide:')) return '\u{1F3DD}\u{FE0F}'
  return value
}
