import type { Entry, Person, Task, GroupView } from '../types'

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

export function beneficiariesOf(task: Task, members: Person[]): string[] {
  if (task.beneficiaryIds === null) return members.map((m) => m.id)
  return task.beneficiaryIds.filter((id) => members.some((m) => m.id === id))
}

/**
 * Combien la tache coute au groupe, selon le nombre de personnes servies.
 *
 * Diviser au prorata punissait trop : cuisiner pour cinq personnes sur dix ne
 * demande pas la moitie du travail de cuisiner pour dix. On suit donc une
 * courbe plutot qu'une droite. Sur une tache a 35 points dans un groupe de
 * dix, servir la moitie du groupe rapporte 23 points au lieu de 17,5.
 *
 * L'exposant regle la douceur : 1 redonne la division stricte, 0 rendrait la
 * tache independante du nombre de servis.
 */
const SCALE_EXPONENT = 0.6

export function shareOfGroup(served: number, groupSize: number): number {
  if (served <= 0 || groupSize <= 0) return 0
  return Math.min(1, served / groupSize) ** SCALE_EXPONENT
}

/**
 * Construit la ligne de compte d'une tache faite.
 *
 * Les points ne font que monter : seuls ceux qui font la tache en gagnent, et
 * personne n'est jamais debite. Un compteur qui descend transforme un sejour
 * en ardoise, et l'ardoise fache.
 *
 * Ce qui remplace le debit, c'est le comptage des servis : on ne compte que
 * les gens servis **autres que ceux qui ont fait la tache**. Se faire a manger
 * pour soi seul ne rapporte donc toujours rien, et cuisiner pour le groupe
 * entier rapporte presque tout, puisqu'on mange aussi.
 *
 * Le revers assume : servir peu de monde rapporte moins, mais pas au prorata,
 * de la meme facon qu'un repas prepare pour deux demande presque autant de
 * travail qu'un repas prepare pour dix.
 */
export function completionAmounts(
  points: number,
  doerIds: string[],
  beneficiaryIds: string[],
  /** Combien de personnes compte le groupe. Par defaut, la tache profite a tous. */
  groupSize: number = beneficiaryIds.length,
) {
  const amounts: Record<string, number> = {}
  if (doerIds.length === 0 || beneficiaryIds.length === 0) return amounts

  const servis = beneficiaryIds.filter((id) => !doerIds.includes(id)).length
  const total = Math.round(points * CENTI * shareOfGroup(servis, groupSize))

  const credits = splitExact(total, doerIds.length)
  doerIds.forEach((id, i) => {
    amounts[id] = (amounts[id] ?? 0) + credits[i]
  })

  return amounts
}

/**
 * Malus : la personne qui s'etait engagee perd une partie de ce qu'elle avait
 * gagne. Rien n'est redistribue, et le solde ne descend pas sous zero : on ne
 * peut pas devoir au groupe, seulement en avoir moins fait que les autres.
 */
export function penaltyAmounts(penalty: number, culpritId: string) {
  return { [culpritId]: -Math.round(penalty * CENTI) }
}

export interface Balance {
  member: Person
  /** Total en centiemes. Il ne descend jamais sous zero. */
  centi: number
  /** Ce que la personne a apporte aux autres. Egal au total, hors malus. */
  givenCenti: number
  tasksDone: number
  lastActiveAt: string | null
  rank: number
}

export function balances(state: GroupView): Balance[] {
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
    // Un malus peut manger plus que ce qu'on avait : le compteur s'arrete a
    // zero plutot que de passer dans le rouge.
    return { member, centi: Math.max(0, centi), givenCenti, tasksDone, lastActiveAt, rank: 0 }
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

/** Un total ne porte pas de signe : il ne peut plus etre negatif. */
export function formatBalance(centi: number): string {
  return String(toPoints(centi))
}

export function entriesForTask(state: GroupView, taskId: string): Entry | undefined {
  return state.entries.find((e) => e.taskId === taskId)
}
