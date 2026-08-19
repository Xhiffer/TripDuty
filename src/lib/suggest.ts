import type { Task, GroupView } from '../types'
import { CENTI, beneficiariesOf, type Balance } from './ledger'

export interface Suggestion {
  memberId: string
  centi: number // solde actuel, pour afficher la raison
}

/**
 * Qui aurait interet a faire cette tache ? On simule le resultat pour chaque
 * personne et on garde celles qui rapprochent le plus le groupe de l'equilibre.
 * Ce n'est qu'une suggestion : personne n'est designe ni prevenu.
 */
export function suggestFor(
  task: Task,
  state: GroupView,
  rows: Balance[],
  excluded: Set<string> = new Set(),
): Suggestion[] {
  const beneficiaries = new Set(beneficiariesOf(task, state.members))
  // Meme bareme que completionAmounts : un prix par tete fixe, un credit qui
  // suit le nombre de personnes servies.
  const perHead = Math.round((task.points * CENTI) / Math.max(1, state.members.length))
  const total = perHead * beneficiaries.size

  const candidates = rows
  if (candidates.length === 0) return []

  const scored = candidates.map((candidate) => {
    // Les debits tombent sur les beneficiaires quoi qu'il arrive :
    // seul le credit change selon qui fait la tache.
    const spread = rows.reduce((sum, row) => {
      let next = row.centi
      if (row.member.id === candidate.member.id) next += total
      if (beneficiaries.has(row.member.id)) next -= perHead
      return sum + next * next
    }, 0)
    return { memberId: candidate.member.id, centi: candidate.centi, spread }
  })

  scored.sort((a, b) => {
    const aOut = excluded.has(a.memberId) ? 1 : 0
    const bOut = excluded.has(b.memberId) ? 1 : 0
    if (aOut !== bOut) return aOut - bOut
    if (a.spread !== b.spread) return a.spread - b.spread
    return a.centi - b.centi
  })

  return scored.slice(0, 3).map(({ memberId, centi }) => ({ memberId, centi }))
}

/**
 * Suggestions pour toute une journee. Une meme personne n'arrive pas en tete
 * de toutes les taches du jour : sinon celui qui a decroche se prend six
 * suggestions au reveil et ferme l'application.
 */
export function suggestForDay(state: GroupView, rows: Balance[], day: string): Map<string, Suggestion[]> {
  const result = new Map<string, Suggestion[]>()
  const alreadyFirst = new Set<string>()

  const open = state.tasks
    .filter((task) => task.date === day && task.status === 'todo' && !task.assignedTo && !task.isClosing)
    .sort((a, b) => a.time.localeCompare(b.time))

  for (const task of open) {
    const suggestions = suggestFor(task, state, rows, alreadyFirst)
    if (suggestions.length > 0) alreadyFirst.add(suggestions[0].memberId)
    result.set(task.id, suggestions)
  }
  return result
}
