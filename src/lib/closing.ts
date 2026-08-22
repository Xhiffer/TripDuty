import type { Task, GroupView } from '../types'
import type { CatalogEntry } from './catalog'
import type { Balance } from './ledger'

/** Grosses taches de fin de sejour, pre-remplies et modifiables par le chef. */
export const CLOSING_CATALOG: CatalogEntry[] = [
  { famille: 'cloture', key: 'deep_clean', emoji: '🧹', points: 57, needsLicense: false, fr: 'Grand ménage de la maison', en: 'Deep clean the house' },
  { famille: 'cloture', key: 'passer_l_aspirateur_partout', emoji: '🌀', points: 30, needsLicense: false, fr: 'Passer l\'aspirateur partout', en: 'Vacuum everywhere' },
  { famille: 'cloture', key: 'nettoyer_toutes_les_salles', emoji: '🛁', points: 30, needsLicense: false, fr: 'Nettoyer toutes les salles de bain', en: 'Clean every bathroom' },
  { famille: 'cloture', key: 'charger_les_voitures_pour', emoji: '🧳', points: 30, needsLicense: false, fr: 'Charger les voitures pour le retour', en: 'Load the cars for the trip home' },
  { famille: 'cloture', key: 'empty_fridge', emoji: '🧊', points: 26, needsLicense: false, fr: 'Vider et nettoyer le frigo', en: 'Empty and clean the fridge' },
  { famille: 'cloture', key: 'sortir_toutes_les_poubelles', emoji: '🗑️', points: 21, needsLicense: false, fr: 'Sortir toutes les poubelles et le verre', en: 'Take out all the bins and the glass' },
  { famille: 'cloture', key: 'nettoyer_le_barbecue_et', emoji: '🔥', points: 20, needsLicense: false, fr: 'Nettoyer le barbecue et la plancha', en: 'Clean the barbecue and the griddle' },
  { famille: 'cloture', key: 'faire_l_etat_des', emoji: '📋', points: 19, needsLicense: false, fr: 'Faire l\'état des lieux avec le propriétaire', en: 'Do the check-out with the owner' },
  { famille: 'cloture', key: 'hand_keys', emoji: '🗝️', points: 19, needsLicense: false, fr: 'Rendre les clés et attendre le propriétaire', en: 'Hand back the keys and wait for the owner' },
  { famille: 'cloture', key: 'solder_les_comptes_du', emoji: '🧮', points: 19, needsLicense: false, fr: 'Solder les comptes du séjour', en: 'Settle up the trip accounts' },
  { famille: 'cloture', key: 'defaire_tous_les_lits', emoji: '🛏️', points: 16, needsLicense: false, fr: 'Défaire tous les lits et regrouper le linge', en: 'Strip every bed and gather the linen' },
  { famille: 'cloture', key: 'rendre_a_chacun_ce', emoji: '🎒', points: 14, needsLicense: false, fr: 'Rendre à chacun ce qu\'il a oublié', en: 'Get everyone back what they left behind' },
]

export interface ClosingMatch {
  task: Task
  memberId: string | null
  centi: number
}

/**
 * Bilan de fin de sejour : on trie les gens du moins fourni au plus fourni,
 * les taches de cloture de la plus lourde a la plus legere, et on apparie.
 * Celui qui en a le moins fait herite de la plus grosse.
 *
 * On ne propose que ceux qui sont sous la moyenne du groupe : au-dessus, la
 * personne a deja fait sa part, et lui coller le grand menage serait injuste.
 */
export function matchClosing(state: GroupView, rows: Balance[]): ClosingMatch[] {
  const tasks = state.tasks
    .filter((task) => task.isClosing && task.status === 'todo')
    .sort((a, b) => b.points - a.points)

  if (rows.length === 0) return tasks.map((task) => ({ task, memberId: null, centi: 0 }))
  const moyenne = rows.reduce((sum, row) => sum + row.centi, 0) / rows.length
  const enRetard = rows.filter((row) => row.centi < moyenne).sort((a, b) => a.centi - b.centi)

  return tasks.map((task, i) => {
    const candidat = enRetard[i]
    if (!candidat) return { task, memberId: null, centi: 0 }
    if (task.needsLicense && !candidat.member.hasLicense) {
      const fallback = enRetard.slice(i).find((d) => d.member.hasLicense)
      if (fallback) return { task, memberId: fallback.member.id, centi: fallback.centi }
      return { task, memberId: null, centi: 0 }
    }
    return { task, memberId: candidat.member.id, centi: candidat.centi }
  })
}
