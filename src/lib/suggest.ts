import type { Task, GroupView } from '../types'
import { type Balance } from './ledger'

export interface Suggestion {
  memberId: string
  centi: number // total actuel, pour afficher la raison
}

/**
 * Qui aurait interet a faire cette tache ?
 *
 * Depuis que les points ne font que monter, la reponse est simple : celui qui
 * en a le moins. Faire la tache rapporte la meme chose a n'importe qui, donc
 * ce qui resserre le groupe, c'est de la confier a celui qui ferme la marche.
 *
 * Ce n'est qu'une suggestion : personne n'est designe ni prevenu.
 */
export function suggestFor(
  _task: Task,
  _state: GroupView,
  rows: Balance[],
  excluded: Set<string> = new Set(),
): Suggestion[] {
  if (rows.length === 0) return []

  const scored = rows.map((row) => ({ memberId: row.member.id, centi: row.centi }))

  scored.sort((a, b) => {
    // Une personne deja placee en tete d'une autre tache du jour recule.
    const aOut = excluded.has(a.memberId) ? 1 : 0
    const bOut = excluded.has(b.memberId) ? 1 : 0
    if (aOut !== bOut) return aOut - bOut
    return a.centi - b.centi
  })

  return scored.slice(0, 3)
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
