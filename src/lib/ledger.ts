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
 * Construit la ligne de compte d'une tache faite.
 * Ceux qui la font sont credites, ceux pour qui elle est faite sont debites.
 * Celui qui fait la tache est en general aussi beneficiaire, comme celui
 * qui paie le restaurant y mange aussi.
 *
 * Les points du catalogue disent ce que vaut la tache quand elle profite au
 * groupe entier. Ce qui ne bouge jamais, c'est le prix par tete : chaque
 * beneficiaire est debite de points / taille du groupe, qu'ils soient deux ou
 * dix. Cuisiner pour cinq dans un groupe de dix rapporte donc la moitie de ce
 * que rapporte cuisiner pour dix, et se faire a manger pour soi seul ne
 * rapporte rien du tout — on se debite exactement de ce qu'on se credite.
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

  // Le prix par tete est arrondi une seule fois, puis multiplie : c'est ce qui
  // garantit que les debits tombent juste et que la somme fasse zero.
  const perHead = Math.round((points * CENTI) / Math.max(1, groupSize))
  const total = perHead * beneficiaryIds.length

  const credits = splitExact(total, doerIds.length)
  doerIds.forEach((id, i) => {
    amounts[id] = (amounts[id] ?? 0) + credits[i]
  })

  beneficiaryIds.forEach((id) => {
    amounts[id] = (amounts[id] ?? 0) - perHead
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
  member: Person
  /** Solde en centiemes. Positif : la personne a donne plus qu'elle n'a recu. */
  centi: number
  /** Ce que la personne a reellement apporte aux autres, sa propre part deduite. */
  givenCenti: number
  tasksDone: number
  lastActiveAt: string | null
  rank: number
}

/**
 * Ce que chaque beneficiaire a paye sur une ligne. Le prix par tete est le
 * meme pour tous, il se relit donc sur n'importe quel beneficiaire qui n'a
 * pas fait la tache. Quand la tache ne profite qu'a ceux qui l'ont faite,
 * personne n'a rien recu : il n'y a rien a compter.
 */
function debitPerHead(entry: Entry): number {
  const outside = entry.beneficiaryIds.filter((id) => !entry.doerIds.includes(id))
  if (outside.length === 0) return 0
  const paid = outside.reduce((sum, id) => sum + (entry.amounts[id] ?? 0), 0)
  return Math.round(-paid / outside.length)
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
        // Le solde de la ligne est deja net de sa propre part. Ce qu'on veut
        // afficher ici, c'est le brut : ce qu'elle a apporte aux autres.
        const own = entry.beneficiaryIds.includes(member.id) ? debitPerHead(entry) : 0
        givenCenti += Math.max(0, (amount ?? 0) + own)
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
 * L'ecart a rattraper, d'une personne a l'autre.
 *
 * Ce n'est pas une dette et l'application ne le presente pas comme telle :
 * personne ne « doit une tache » a personne, on montre seulement le plus court
 * chemin qui ramenerait tout le monde a l'equilibre. On part des soldes, jamais
 * d'un suivi deux a deux, pour la meme raison qu'un Tricount : moins
 * d'echanges, et aucun historique de reproches.
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

export function entriesForTask(state: GroupView, taskId: string): Entry | undefined {
  return state.entries.find((e) => e.taskId === taskId)
}
