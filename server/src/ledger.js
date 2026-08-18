// Meme calcul que src/lib/ledger.ts cote application, mais c'est le serveur
// qui fait foi : un telephone ne peut pas s'inventer des points.

export const CENTI = 100

/** Repartit un total entier sans jamais perdre ni inventer un centieme. */
export function splitExact(total, n) {
  if (n <= 0) return []
  const base = Math.floor(total / n)
  const rest = total - base * n
  return Array.from({ length: n }, (_, i) => base + (i < rest ? 1 : 0))
}

/**
 * Ceux qui font la tache sont credites, ceux pour qui elle est faite sont
 * debites. Celui qui fait la tache est en general aussi beneficiaire, comme
 * celui qui paie le restaurant y mange aussi.
 */
export function completionAmounts(points, doerIds, beneficiaryIds) {
  const total = Math.round(points * CENTI)
  const amounts = {}

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
export function penaltyAmounts(penalty, culpritId, beneficiaryIds) {
  const total = Math.round(penalty * CENTI)
  const amounts = { [culpritId]: -total }
  const targets = beneficiaryIds.filter((id) => id !== culpritId)
  if (targets.length === 0) return { [culpritId]: 0 }
  const shares = splitExact(total, targets.length)
  targets.forEach((id, i) => {
    amounts[id] = (amounts[id] ?? 0) + shares[i]
  })
  return amounts
}
