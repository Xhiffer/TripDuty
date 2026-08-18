import type { Task, TripState } from '../types'
import type { Balance } from './ledger'

/** Grosses taches de fin de sejour, pre-remplies et modifiables par le chef. */
export const CLOSING_CATALOG = [
  {
    key: 'final_clean',
    emoji: '🧽',
    points: 40,
    needsLicense: false,
    fr: 'Le grand ménage du départ',
    en: 'The big departure clean',
  },
  {
    key: 'round_drinks',
    emoji: '🍻',
    points: 30,
    needsLicense: false,
    fr: 'La tournée au bar',
    en: 'A round at the bar',
  },
  {
    key: 'return_fuel',
    emoji: '⛽',
    points: 25,
    needsLicense: true,
    fr: "Le plein d'essence du retour",
    en: 'Fill the tank for the way back',
  },
  {
    key: 'empty_fridge',
    emoji: '🧊',
    points: 20,
    needsLicense: false,
    fr: 'Vider et nettoyer le frigo',
    en: 'Empty and clean the fridge',
  },
  {
    key: 'last_dishes',
    emoji: '🍽️',
    points: 20,
    needsLicense: false,
    fr: 'La vaisselle du dernier soir',
    en: 'Wash up on the last night',
  },
  {
    key: 'hand_keys',
    emoji: '🔑',
    points: 15,
    needsLicense: false,
    fr: "Rendre les clés et faire l'état des lieux",
    en: 'Hand back the keys and check out',
  },
  {
    key: 'return_toll',
    emoji: '🛣️',
    points: 15,
    needsLicense: true,
    fr: 'Le péage du retour',
    en: 'The toll on the way back',
  },
]

export interface ClosingMatch {
  task: Task
  memberId: string | null
  centi: number
}

/**
 * Bilan de fin de sejour : on trie les gens du plus negatif au moins negatif,
 * les taches de cloture de la plus lourde a la plus legere, et on apparie.
 * Celui qui doit le plus au groupe herite de la plus grosse.
 */
export function matchClosing(state: TripState, rows: Balance[]): ClosingMatch[] {
  const tasks = state.tasks
    .filter((task) => task.isClosing && task.status === 'todo')
    .sort((a, b) => b.points - a.points)

  // En dessous d'un point de dette, on considere la personne a l'equilibre.
  const debtors = rows.filter((row) => row.centi <= -100).sort((a, b) => a.centi - b.centi)

  return tasks.map((task, i) => {
    const debtor = debtors[i]
    if (!debtor) return { task, memberId: null, centi: 0 }
    if (task.needsLicense && !debtor.member.hasLicense) {
      const fallback = debtors.slice(i).find((d) => d.member.hasLicense)
      if (fallback) return { task, memberId: fallback.member.id, centi: fallback.centi }
      return { task, memberId: null, centi: 0 }
    }
    return { task, memberId: debtor.member.id, centi: debtor.centi }
  })
}
