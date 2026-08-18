import type { Entry, Member, Role, Task, Trip, TripState } from '../types'

/**
 * Une modification du sejour, decrite comme un fait acheve.
 *
 * C'est la piece centrale du partage entre telephones. Tant que chaque
 * telephone renvoyait l'etat complet du sejour, la derniere ecriture effacait
 * silencieusement celles qu'elle n'avait pas vues : celui qui ajoutait une
 * tache supprimait sans le savoir la validation faite trois secondes plus tot
 * par quelqu'un d'autre. Ici, chaque geste ne parle que de ce qu'il touche,
 * et deux gestes portant sur des lignes differentes ne peuvent plus se croiser.
 *
 * Deux regles rendent cela vrai :
 *
 *   1. Une mutation se suffit a elle-meme. Les identifiants et les horodatages
 *      sont fixes au moment du geste, jamais recalcules a l'application. Le
 *      meme message rejoue sur un autre telephone donne exactement le meme
 *      resultat.
 *   2. Une mutation porte une valeur, jamais une variation. `setRecurring` dit
 *      le nouvel etat, pas « inverse-le » : deux telephones qui basculent la
 *      meme tache aboutissent au meme endroit, au lieu de s'annuler.
 */
export type Mutation =
  | { type: 'addMember'; member: Member }
  | { type: 'setRole'; memberId: string; role: Role }
  | { type: 'addTask'; task: Task }
  | { type: 'assignTask'; taskId: string; memberId: string | null }
  | { type: 'setRecurring'; taskId: string; recurring: boolean }
  | { type: 'settleTask'; taskId: string; status: 'done' | 'missed'; entry: Entry }
  | { type: 'reopenTask'; taskId: string }
  | { type: 'deleteTask'; taskId: string }
  | { type: 'updateTrip'; patch: Partial<Trip> }

/**
 * Applique une mutation a un etat, sans jamais modifier l'original.
 *
 * Fonction pure : c'est elle qui garantit qu'un telephone et la base en ligne
 * racontent la meme histoire. Elle est donc la partie la plus testee de la
 * couche de donnees.
 */
export function applyMutation(state: TripState, mutation: Mutation): TripState {
  switch (mutation.type) {
    case 'addMember': {
      // Rejoindre deux fois depuis le meme telephone ne cree pas de doublon.
      if (state.members.some((m) => m.id === mutation.member.id)) return state
      return { ...state, members: [...state.members, mutation.member] }
    }

    case 'setRole': {
      return {
        ...state,
        members: state.members.map((m) =>
          // Le createur du sejour ne peut pas etre retrograde.
          m.id === mutation.memberId && m.role !== 'owner' ? { ...m, role: mutation.role } : m,
        ),
      }
    }

    case 'addTask': {
      if (state.tasks.some((t) => t.id === mutation.task.id)) return state
      return { ...state, tasks: [...state.tasks, mutation.task] }
    }

    case 'assignTask': {
      return {
        ...state,
        tasks: state.tasks.map((t) => (t.id === mutation.taskId ? { ...t, assignedTo: mutation.memberId } : t)),
      }
    }

    case 'setRecurring': {
      return {
        ...state,
        tasks: state.tasks.map((t) => (t.id === mutation.taskId ? { ...t, recurring: mutation.recurring } : t)),
      }
    }

    case 'settleTask': {
      // Une tache supprimee entre-temps n'a plus de ligne de compte a porter :
      // l'accepter laisserait une ecriture orpheline dans le classement.
      if (!state.tasks.some((t) => t.id === mutation.taskId)) return state
      return {
        ...state,
        tasks: state.tasks.map((t) => (t.id === mutation.taskId ? { ...t, status: mutation.status } : t)),
        // Une tache porte au plus une ligne de compte, comme le `unique (task_id)`
        // de la base. Revalider remplace, cela n'empile pas.
        entries: [...state.entries.filter((e) => e.taskId !== mutation.taskId), mutation.entry],
      }
    }

    case 'reopenTask': {
      return {
        ...state,
        tasks: state.tasks.map((t) => (t.id === mutation.taskId ? { ...t, status: 'todo' } : t)),
        entries: state.entries.filter((e) => e.taskId !== mutation.taskId),
      }
    }

    case 'deleteTask': {
      return {
        ...state,
        tasks: state.tasks.filter((t) => t.id !== mutation.taskId),
        entries: state.entries.filter((e) => e.taskId !== mutation.taskId),
      }
    }

    case 'updateTrip': {
      return { ...state, trip: { ...state.trip, ...mutation.patch } }
    }
  }
}
