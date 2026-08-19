import type { Account, AppData, Entry, Expense, Group, Membership, Role, Task } from '../types'

/**
 * Une modification, decrite comme un fait acheve.
 *
 * C'est la piece qui rend le partage possible. Tant que chaque telephone
 * renvoyait l'etat complet a chaque geste, la derniere ecriture effacait
 * silencieusement celles qu'elle n'avait pas vues : celui qui ajoutait une
 * tache supprimait la validation faite trois secondes plus tot par quelqu'un
 * d'autre. Ici, chaque geste ne parle que de ce qu'il touche, et deux gestes
 * portant sur des lignes differentes ne peuvent plus se croiser.
 *
 * Deux regles rendent cela vrai :
 *
 *   1. Une mutation se suffit a elle-meme. Identifiants, horodatages et
 *      montants sont fixes au moment du geste, jamais recalcules a l'arrivee.
 *      Rejouee ailleurs, elle donne exactement le meme resultat.
 *   2. Une mutation porte une valeur, jamais une variation. `setRecurring` dit
 *      le nouvel etat, pas « inverse-le » : deux telephones qui appuient
 *      ensemble tombent d'accord au lieu de s'annuler.
 */
export type Mutation =
  | { type: 'addAccount'; account: Account }
  | { type: 'updateProfile'; accountId: string; patch: Partial<Omit<Account, 'id' | 'passwordHash'>> }
  // Creer un groupe est un geste unique : le groupe, l'hote et les taches de
  // cloture arrivent ensemble ou pas du tout. C'est aussi ce que fait la
  // fonction create_group() cote base.
  | { type: 'addGroup'; group: Group; membership: Membership; closingTasks: Task[] }
  | { type: 'addMembership'; membership: Membership }
  | { type: 'removeMembership'; groupId: string; accountId: string }
  | { type: 'removeGroup'; groupId: string }
  | { type: 'updateGroup'; groupId: string; patch: Partial<Group> }
  | { type: 'setRole'; groupId: string; accountId: string; role: Role }
  | { type: 'setLicense'; groupId: string; accountId: string; hasLicense: boolean }
  | { type: 'addTask'; task: Task }
  | { type: 'assignTask'; taskId: string; accountId: string | null }
  | { type: 'setRecurring'; taskId: string; recurring: boolean }
  | { type: 'settleTask'; taskId: string; status: 'done' | 'missed'; entry: Entry }
  | { type: 'reopenTask'; taskId: string }
  | { type: 'deleteTask'; taskId: string }
  | { type: 'addExpense'; expense: Expense }
  | { type: 'updateExpense'; expenseId: string; patch: Partial<Expense> }
  | { type: 'deleteExpense'; expenseId: string }

/**
 * Applique une mutation, sans jamais modifier l'original.
 *
 * Fonction pure : c'est elle qui garantit qu'un telephone et la base en ligne
 * racontent la meme histoire. La partie la plus testee de la couche de donnees.
 */
export function applyMutation(data: AppData, mutation: Mutation): AppData {
  switch (mutation.type) {
    case 'addAccount': {
      if (data.accounts.some((a) => a.id === mutation.account.id)) return data
      return { ...data, accounts: [...data.accounts, mutation.account] }
    }

    case 'updateProfile': {
      return {
        ...data,
        accounts: data.accounts.map((a) => (a.id === mutation.accountId ? { ...a, ...mutation.patch } : a)),
      }
    }

    case 'addGroup': {
      if (data.groups.some((g) => g.id === mutation.group.id)) return data
      return {
        ...data,
        groups: [...data.groups, mutation.group],
        memberships: [...data.memberships, mutation.membership],
        tasks: [...data.tasks, ...mutation.closingTasks],
      }
    }

    case 'addMembership': {
      // Rejoindre deux fois le meme groupe ne cree pas de doublon.
      const already = data.memberships.some(
        (m) => m.groupId === mutation.membership.groupId && m.accountId === mutation.membership.accountId,
      )
      if (already) return data
      return { ...data, memberships: [...data.memberships, mutation.membership] }
    }

    case 'removeMembership': {
      return {
        ...data,
        memberships: data.memberships.filter(
          (m) => !(m.groupId === mutation.groupId && m.accountId === mutation.accountId),
        ),
      }
    }

    case 'removeGroup': {
      // Le dernier ferme la porte : taches et ecritures partent avec le groupe,
      // comme le `on delete cascade` de la base.
      return {
        ...data,
        groups: data.groups.filter((g) => g.id !== mutation.groupId),
        memberships: data.memberships.filter((m) => m.groupId !== mutation.groupId),
        tasks: data.tasks.filter((t) => t.groupId !== mutation.groupId),
        entries: data.entries.filter((e) => e.groupId !== mutation.groupId),
      }
    }

    case 'updateGroup': {
      return {
        ...data,
        groups: data.groups.map((g) => (g.id === mutation.groupId ? { ...g, ...mutation.patch } : g)),
      }
    }

    case 'setRole': {
      return {
        ...data,
        memberships: data.memberships.map((m) =>
          // L'hote ne peut pas etre retrograde, y compris par lui-meme : un
          // groupe sans responsable n'a plus personne pour le regler.
          m.groupId === mutation.groupId && m.accountId === mutation.accountId && m.role !== 'host'
            ? { ...m, role: mutation.role }
            : m,
        ),
      }
    }

    case 'setLicense': {
      return {
        ...data,
        memberships: data.memberships.map((m) =>
          m.groupId === mutation.groupId && m.accountId === mutation.accountId
            ? { ...m, hasLicense: mutation.hasLicense }
            : m,
        ),
      }
    }

    case 'addTask': {
      if (data.tasks.some((t) => t.id === mutation.task.id)) return data
      return { ...data, tasks: [...data.tasks, mutation.task] }
    }

    case 'assignTask': {
      return {
        ...data,
        tasks: data.tasks.map((t) => (t.id === mutation.taskId ? { ...t, assignedTo: mutation.accountId } : t)),
      }
    }

    case 'setRecurring': {
      return {
        ...data,
        tasks: data.tasks.map((t) => (t.id === mutation.taskId ? { ...t, recurring: mutation.recurring } : t)),
      }
    }

    case 'settleTask': {
      // Une tache supprimee entre-temps n'a plus de ligne de compte a porter :
      // l'accepter laisserait une ecriture orpheline dans le classement.
      if (!data.tasks.some((t) => t.id === mutation.taskId)) return data
      return {
        ...data,
        tasks: data.tasks.map((t) => (t.id === mutation.taskId ? { ...t, status: mutation.status } : t)),
        // Une tache porte au plus une ligne, comme le `unique (task_id)` de la
        // base. Revalider remplace, cela n'empile pas.
        entries: [...data.entries.filter((e) => e.taskId !== mutation.taskId), mutation.entry],
      }
    }

    case 'reopenTask': {
      return {
        ...data,
        tasks: data.tasks.map((t) => (t.id === mutation.taskId ? { ...t, status: 'todo' } : t)),
        entries: data.entries.filter((e) => e.taskId !== mutation.taskId),
      }
    }

    case 'deleteTask': {
      return {
        ...data,
        tasks: data.tasks.filter((t) => t.id !== mutation.taskId),
        entries: data.entries.filter((e) => e.taskId !== mutation.taskId),
      }
    }

    case 'addExpense': {
      return { ...data, expenses: [...data.expenses, mutation.expense] }
    }

    case 'updateExpense': {
      return {
        ...data,
        expenses: data.expenses.map((e) => (e.id === mutation.expenseId ? { ...e, ...mutation.patch } : e)),
      }
    }

    case 'deleteExpense': {
      return { ...data, expenses: data.expenses.filter((e) => e.id !== mutation.expenseId) }
    }
  }
}
