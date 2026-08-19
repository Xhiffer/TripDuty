import type { Expense, Person } from '../types'

/**
 * L'argent du groupe, tenu a part des points.
 *
 * Les points repartissent l'effort, les euros repartissent la depense : les
 * melanger reviendrait a decider qu'une vaisselle vaut quatre euros. Deux
 * comptes separes, deux ecrans.
 *
 * Tout est en centimes : 75,00 euros valent 7500, et aucune division ne perd
 * un centime en route.
 */

export function splitCents(total: number, n: number): number[] {
  if (n <= 0) return []
  const base = Math.floor(total / n)
  const rest = total - base * n
  // Les premieres parts prennent le centime restant.
  return Array.from({ length: n }, (_, i) => base + (i < rest ? 1 : 0))
}

/** Ce que la depense change pour chacun. La somme fait toujours zero. */
export function expenseAmounts(expense: Expense): Record<string, number> {
  const amounts: Record<string, number> = { [expense.payerId]: expense.amountCents }
  const shares = splitCents(expense.amountCents, expense.participantIds.length)
  expense.participantIds.forEach((id, i) => {
    amounts[id] = (amounts[id] ?? 0) - shares[i]
  })
  return amounts
}

export interface MoneyBalance {
  member: Person
  /** Positif : la personne a avance de l'argent pour les autres. */
  cents: number
  /** Ce qu'elle a sorti de sa poche, toutes depenses confondues. */
  paidCents: number
}

export function moneyBalances(members: Person[], expenses: Expense[]): MoneyBalance[] {
  const rows = members.map((member) => {
    let cents = 0
    let paidCents = 0
    for (const expense of expenses) {
      const amounts = expenseAmounts(expense)
      cents += amounts[member.id] ?? 0
      if (expense.payerId === member.id) paidCents += expense.amountCents
    }
    return { member, cents, paidCents }
  })
  rows.sort((a, b) => b.cents - a.cents)
  return rows
}

export interface Reimbursement {
  fromId: string
  toId: string
  cents: number
}

/**
 * Qui rembourse qui, en le moins de virements possible.
 * On ne suit jamais les dettes deux a deux : on part des soldes.
 */
export function reimbursements(rows: MoneyBalance[]): Reimbursement[] {
  const debtors = rows
    .filter((r) => r.cents < 0)
    .map((r) => ({ id: r.member.id, left: -r.cents }))
    .sort((a, b) => b.left - a.left)
  const creditors = rows
    .filter((r) => r.cents > 0)
    .map((r) => ({ id: r.member.id, left: r.cents }))
    .sort((a, b) => b.left - a.left)

  const out: Reimbursement[] = []
  let i = 0
  let j = 0
  while (i < debtors.length && j < creditors.length) {
    const amount = Math.min(debtors[i].left, creditors[j].left)
    // En dessous d'un centime, c'est du bruit.
    if (amount >= 1) out.push({ fromId: debtors[i].id, toId: creditors[j].id, cents: amount })
    debtors[i].left -= amount
    creditors[j].left -= amount
    if (debtors[i].left <= 0) i += 1
    if (creditors[j].left <= 0) j += 1
  }
  return out
}

export function formatEuros(cents: number): string {
  const sign = cents < 0 ? '-' : ''
  const abs = Math.abs(cents)
  // Espace fine insecable entre les milliers : 1 559,10 €
  const units = String(Math.floor(abs / 100)).replace(/\B(?=(\d{3})+(?!\d))/g, '\u202f')
  return `${sign}${units},${String(abs % 100).padStart(2, '0')} €`
}

export function formatSignedEuros(cents: number): string {
  return cents > 0 ? `+${formatEuros(cents)}` : formatEuros(cents)
}

/** Categories proposees a la saisie, avec leur icone. */
export const EXPENSE_CATEGORIES = [
  { emoji: '🛒', fr: 'Courses', en: 'Groceries' },
  { emoji: '🍽️', fr: 'Restaurant', en: 'Restaurant' },
  { emoji: '⛽', fr: 'Essence', en: 'Fuel' },
  { emoji: '🚕', fr: 'Transport', en: 'Transport' },
  { emoji: '🏠', fr: 'Logement', en: 'Accommodation' },
  { emoji: '🎟️', fr: 'Activité', en: 'Activity' },
  { emoji: '🍻', fr: 'Bar', en: 'Bar' },
  { emoji: '🧊', fr: 'Boissons', en: 'Drinks' },
  { emoji: '🛣️', fr: 'Péage', en: 'Toll' },
  { emoji: '💊', fr: 'Pharmacie', en: 'Pharmacy' },
  { emoji: '🧾', fr: 'Divers', en: 'Other' },
]
