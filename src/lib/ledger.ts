import type { Entry, Member, Task, TripState } from '../types'

/** Tout est compte en centiemes de point pour que les divisions tombent juste. */
export const CENTI = 100

/**
 * Repartit un total entier entre n parts, sans jamais perdre ni inventer
 * un centieme : les premieres parts recoivent le reste de la division.
 */
export function splitExact(total: number, n: number): number[] {
  if (n <= 0) return []
  const base = Math.floor(total / n)
  const rest = total - base * n
  return Array.from({ length: n }, (_, i) => base + (i < rest ? 1 : 0))
}

export function beneficiariesOf(task: Task, members: Member[]): string[] {
  if (task.beneficiaryIds === null) return members.map((m) => m.id)
  return task.beneficiaryIds.filter((id) => members.some((m) => m.id === id))
}

/**
 * Construit la ligne de compte d'une tache faite.
 * Ceux qui la font sont credites, ceux pour qui elle est faite sont debites.
 * Celui qui fait la tache est en general aussi beneficiaire, comme celui
 * qui paie le restaurant y mange aussi.
 */
export function completionAmounts(points: number, doerIds: string[], beneficiaryIds: string[]) {
  const total = Math.round(points * CENTI)
  const amounts: Record<string, number> = {}

  const credits = splitExact(total, doerIds.length)
  doerIds.forEach((id, i) => {
    amounts[id] = (amounts[id] ?? 0) + credits[i]
  })

  const debits = splitExact(total, beneficiaryIds.length)
  beneficiaryIds.forEach((id, i) => {
    amounts[id] = (amounts[id] ?? 0) - debits[i]
  })

  return amounts
}

/**
 * Malus : la personne qui s'etait engagee perd des points, et ceux qu'elle a
 * laisses tomber les recuperent. La somme reste a zero.
 */
export function penaltyAmounts(penalty: number, culpritId: string, beneficiaryIds: string[]) {
  const total = Math.round(penalty * CENTI)
  const amounts: Record<string, number> = { [culpritId]: -total }
  const targets = beneficiaryIds.filter((id) => id !== culpritId)
  if (targets.length === 0) return { [culpritId]: 0 }
  const shares = splitExact(total, targets.length)
  targets.forEach((id, i) => {
    amounts[id] = (amounts[id] ?? 0) + shares[i]
  })
  return amounts
}

export interface Balance {
  member: Member
  /** Solde en centiemes. Positif : la personne a donne plus qu'elle n'a recu. */
  centi: number
  /** Points bruts apportes au groupe, pour l'anecdote. */
  givenCenti: number
  tasksDone: number
  lastActiveAt: string | null
  rank: number
}

export function balances(state: TripState): Balance[] {
  const rows = state.members.map((member) => {
    let centi = 0
    let givenCenti = 0
    let tasksDone = 0
    let lastActiveAt: string | null = null

    for (const entry of state.entries) {
      const amount = entry.amounts[member.id]
      if (amount !== undefined) centi += amount
      if (entry.kind === 'completion' && entry.doerIds.includes(member.id)) {
        tasksDone += 1
        givenCenti += Math.max(0, amount ?? 0)
        if (!lastActiveAt || entry.at > lastActiveAt) lastActiveAt = entry.at
      }
    }
    return { member, centi, givenCenti, tasksDone, lastActiveAt, rank: 0 }
  })

  rows.sort((a, b) => {
    if (b.centi !== a.centi) return b.centi - a.centi
    // A egalite, celui qui n'a rien fait depuis le plus longtemps passe derriere.
    const aTime = a.lastActiveAt ?? ''
    const bTime = b.lastActiveAt ?? ''
    if (aTime !== bTime) return bTime.localeCompare(aTime)
    return a.member.joinedAt.localeCompare(b.member.joinedAt)
  })

  rows.forEach((row, i) => {
    row.rank = i + 1
  })
  return rows
}

export function toPoints(centi: number): number {
  return Math.round(centi / CENTI)
}

export function formatBalance(centi: number): string {
  const points = toPoints(centi)
  return points > 0 ? `+${points}` : `${points}`
}

/**
 * Qui doit une tache a qui. On ne suit jamais les dettes deux a deux :
 * on part des soldes et on cherche le plus petit nombre d'echanges qui
 * ramene tout le monde a zero, comme les remboursements de Tricount.
 */
export interface Transfer {
  fromId: string
  toId: string
  centi: number
}

export function settlements(rows: Balance[]): Transfer[] {
  const debtors = rows
    .filter((r) => r.centi < 0)
    .map((r) => ({ id: r.member.id, left: -r.centi }))
    .sort((a, b) => b.left - a.left)
  const creditors = rows
    .filter((r) => r.centi > 0)
    .map((r) => ({ id: r.member.id, left: r.centi }))
    .sort((a, b) => b.left - a.left)

  const transfers: Transfer[] = []
  let i = 0
  let j = 0
  while (i < debtors.length && j < creditors.length) {
    const amount = Math.min(debtors[i].left, creditors[j].left)
    // On n'affiche pas les miettes : en dessous d'un point, c'est du bruit.
    if (amount >= CENTI) transfers.push({ fromId: debtors[i].id, toId: creditors[j].id, centi: amount })
    debtors[i].left -= amount
    creditors[j].left -= amount
    if (debtors[i].left <= 0) i += 1
    if (creditors[j].left <= 0) j += 1
  }
  return transfers
}

export function entriesForTask(state: TripState, taskId: string): Entry | undefined {
  return state.entries.find((e) => e.taskId === taskId)
}
