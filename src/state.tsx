import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { Account, AppData, Group, GroupKind, GroupView, Lang, Person, Role, Task, Theme } from './types'
import type { Mutation } from './data/mutations'
import { applyMutation } from './data/mutations'
import { store } from './data/store'
import { balances, beneficiariesOf, completionAmounts, penaltyAmounts } from './lib/ledger'
import { CLOSING_CATALOG } from './lib/closing'
import { colorFor, fullName, hashPassword, makeInviteCode, normalizeEmail } from './lib/identity'
import { translator } from './lib/i18n'

const SESSION_KEY = 'tripduty:session'
const GROUP_KEY = 'tripduty:group'
const LANG_KEY = 'tripduty:lang'
const THEME_KEY = 'tripduty:theme'
const CONCEPT_KEY = 'tripduty:concept-seen'

function uid(prefix: string) {
  return `${prefix}${Math.random().toString(36).slice(2, 9)}`
}

function todayISO() {
  const d = new Date()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

/** Jour affiche par defaut : aujourd'hui si on est pendant le sejour, sinon le premier jour. */
function activeDateFor(group: Group) {
  const today = todayISO()
  if (today < group.startDate) return group.startDate
  if (today > group.endDate) return group.endDate
  return today
}

export function groupDays(group: Group): string[] {
  const days: string[] = []
  const cursor = new Date(group.startDate + 'T12:00:00')
  const end = new Date(group.endDate + 'T12:00:00')
  let guard = 0
  while (cursor <= end && guard < 400) {
    const m = String(cursor.getMonth() + 1).padStart(2, '0')
    const d = String(cursor.getDate()).padStart(2, '0')
    days.push(`${cursor.getFullYear()}-${m}-${d}`)
    cursor.setDate(cursor.getDate() + 1)
    guard += 1
  }
  return days
}

export type Result = { ok: true } | { ok: false; error: string }

interface Ctx {
  data: AppData
  account: Account | null
  view: GroupView | null
  me: Person | null
  isChef: boolean
  isHost: boolean
  myGroups: Group[]
  conceptSeen: boolean
  lang: Lang
  theme: Theme
  t: (key: string) => string
  activeDate: string
  setLang: (l: Lang) => void
  setTheme: (th: Theme) => void
  // compte
  signUp: (email: string, password: string) => Promise<Result>
  signIn: (email: string, password: string) => Promise<Result>
  signOut: () => void
  updateProfile: (patch: Partial<Omit<Account, 'id' | 'passwordHash'>>) => void
  markConceptSeen: () => void
  // groupes
  selectGroup: (groupId: string | null) => void
  createGroup: (input: {
    kind: GroupKind
    name: string
    emoji: string
    color: string
    startDate: string
    endDate: string
    hasLicense: boolean
  }) => Group
  joinByCode: (code: string) => Result
  inviteByEmail: (email: string) => Result
  /**
   * Quitter un groupe. L'hote doit designer son successeur : un groupe ne doit
   * jamais se retrouver sans responsable. S'il ne reste qu'une personne, c'est
   * elle sans qu'on le lui demande ; s'il ne reste personne, le groupe part.
   * Meme regle que leave_group() dans supabase/migrations/0003_rpc.sql.
   */
  leaveGroup: (groupId: string, newHostId?: string) => Result
  updateGroup: (patch: Partial<Group>) => void
  setRole: (accountId: string, role: Role) => void
  setLicense: (accountId: string, hasLicense: boolean) => void
  // taches
  addTask: (task: Omit<Task, 'id' | 'status' | 'groupId'>) => void
  takeTask: (taskId: string, accountId: string | null) => void
  validateTask: (taskId: string, doerIds: string[], beneficiaryIds: string[]) => void
  markMissed: (taskId: string) => void
  reopenTask: (taskId: string) => void
  deleteTask: (taskId: string) => void
  toggleRecurring: (taskId: string) => void
}

const AppContext = createContext<Ctx | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData | null>(null)
  const [accountId, setAccountId] = useState<string | null>(() => localStorage.getItem(SESSION_KEY))
  const [groupId, setGroupId] = useState<string | null>(() => localStorage.getItem(GROUP_KEY))
  const [conceptSeen, setConceptSeen] = useState(() => localStorage.getItem(CONCEPT_KEY) === '1')
  const [lang, setLangState] = useState<Lang>(() => (localStorage.getItem(LANG_KEY) as Lang) || 'fr')
  const [theme, setThemeState] = useState<Theme>(() => (localStorage.getItem(THEME_KEY) as Theme) || 'dark')

  // L'etat le plus recent, lisible immediatement. `useState` ne rend la nouvelle
  // valeur qu'au rendu suivant : deux gestes rapproches liraient sinon le meme
  // etat, et le second annulerait le premier.
  const latest = useRef<AppData | null>(null)

  const receive = useCallback((next: AppData) => {
    latest.current = next
    setData(next)
  }, [])

  useEffect(() => {
    store.load().then(receive)
    // Un changement venu d'ailleurs (autre onglet aujourd'hui, autre telephone
    // une fois la base branchee) remplace l'etat sans repasser par une mutation :
    // il a deja ete applique a la source.
    return store.subscribe?.(receive)
  }, [receive])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.documentElement.lang = lang
  }, [theme, lang])

  /**
   * Traduit un geste en mutation, l'affiche aussitot, puis l'envoie au magasin.
   *
   * `build` recoit l'etat courant parce qu'une mutation doit partir avec tout ce
   * qu'il lui faut : les points de la tache, les montants calcules,
   * l'horodatage. Une fois construite, elle ne depend plus de ce que le
   * destinataire croit savoir.
   *
   * Rendre `null` annule le geste, lorsqu'il n'a plus de sens.
   */
  const dispatch = useCallback((build: (current: AppData) => Mutation | Mutation[] | null) => {
    const current = latest.current
    if (!current) return
    const built = build(current)
    if (!built) return

    // L'affichage n'attend pas l'ecriture : le geste apparait tout de suite.
    let next = current
    for (const mutation of Array.isArray(built) ? built : [built]) {
      next = applyMutation(next, mutation)
      void store.apply(mutation)
    }
    latest.current = next
    setData(next)
  }, [])

  const t = useMemo(() => translator(lang), [lang])

  const value = useMemo<Ctx | null>(() => {
    if (!data) return null

    const account = data.accounts.find((a) => a.id === accountId) ?? null
    const myMemberships = account ? data.memberships.filter((m) => m.accountId === account.id) : []
    const myGroups = myMemberships
      .map((m) => data.groups.find((g) => g.id === m.groupId))
      .filter((g): g is Group => !!g)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))

    const group = data.groups.find((g) => g.id === groupId) ?? null
    const belongs =
      !!group && !!account && data.memberships.some((m) => m.groupId === group.id && m.accountId === account.id)

    let view: GroupView | null = null
    if (group && belongs) {
      const members: Person[] = data.memberships
        .filter((m) => m.groupId === group.id)
        .map((m) => {
          const person = data.accounts.find((a) => a.id === m.accountId)
          if (!person) return null
          return {
            id: person.id,
            name: person.firstName || person.email,
            photo: person.photo,
            color: person.color || colorFor(person.id),
            hasLicense: m.hasLicense,
            role: m.role,
            joinedAt: m.joinedAt,
          }
        })
        .filter((p): p is Person => !!p)
        .sort((a, b) => a.joinedAt.localeCompare(b.joinedAt))

      view = {
        group,
        members,
        tasks: data.tasks.filter((task) => task.groupId === group.id),
        entries: data.entries.filter((e) => e.groupId === group.id),
      }
    }

    const me = view?.members.find((m) => m.id === account?.id) ?? null
    const isHost = !!me && me.role === 'host'
    const isChef = !!me && (me.role === 'host' || me.role === 'chef')

    function requireGroup(): Group | null {
      return view ? view.group : null
    }

    return {
      data,
      account,
      view,
      me,
      isChef,
      isHost,
      myGroups,
      conceptSeen,
      lang,
      theme,
      t,
      activeDate: group ? activeDateFor(group) : todayISO(),
      setLang: (l) => {
        localStorage.setItem(LANG_KEY, l)
        setLangState(l)
      },
      setTheme: (th) => {
        localStorage.setItem(THEME_KEY, th)
        setThemeState(th)
      },

      signUp: async (email, password) => {
        const clean = normalizeEmail(email)
        if (data.accounts.some((a) => normalizeEmail(a.email) === clean)) {
          return { ok: false, error: 'emailTaken' }
        }
        if (password.length < 6) return { ok: false, error: 'passwordShort' }
        const id = uid('a')
        const created: Account = {
          id,
          email: clean,
          passwordHash: await hashPassword(password),
          firstName: '',
          lastName: '',
          birthDate: '',
          photo: null,
          color: colorFor(id),
          createdAt: new Date().toISOString(),
        }
        dispatch(() => ({ type: 'addAccount', account: created }))
        localStorage.setItem(SESSION_KEY, id)
        setAccountId(id)
        return { ok: true }
      },

      signIn: async (email, password) => {
        const clean = normalizeEmail(email)
        const found = data.accounts.find((a) => normalizeEmail(a.email) === clean)
        if (!found) return { ok: false, error: 'unknownAccount' }
        const hash = await hashPassword(password)
        if (hash !== found.passwordHash) return { ok: false, error: 'wrongPassword' }
        localStorage.setItem(SESSION_KEY, found.id)
        setAccountId(found.id)
        return { ok: true }
      },

      signOut: () => {
        localStorage.removeItem(SESSION_KEY)
        localStorage.removeItem(GROUP_KEY)
        setAccountId(null)
        setGroupId(null)
      },

      updateProfile: (patch) => {
        if (!account) return
        dispatch(() => ({ type: 'updateProfile', accountId: account.id, patch }))
      },

      markConceptSeen: () => {
        localStorage.setItem(CONCEPT_KEY, '1')
        setConceptSeen(true)
      },

      selectGroup: (id) => {
        if (id) localStorage.setItem(GROUP_KEY, id)
        else localStorage.removeItem(GROUP_KEY)
        setGroupId(id)
      },

      createGroup: (input) => {
        const id = uid('g')
        const now = new Date().toISOString()
        const hostId = account?.id ?? ''
        const created: Group = {
          id,
          kind: input.kind,
          name: input.name.trim(),
          emoji: input.emoji,
          color: input.color,
          startDate: input.startDate,
          endDate: input.endDate,
          hostId,
          inviteCode: makeInviteCode(),
          penalty: 30,
          closingOpen: false,
          createdAt: now,
        }
        // Les taches de cloture sont pre-remplies, le chef les modifie ensuite.
        const closingTasks: Task[] = CLOSING_CATALOG.map((c) => ({
          id: uid('t'),
          groupId: id,
          title: c.fr,
          titleKey: c.key,
          emoji: c.emoji,
          points: c.points,
          date: input.endDate,
          time: '10:00',
          needsLicense: c.needsLicense,
          beneficiaryIds: null,
          assignedTo: null,
          status: 'todo' as const,
          createdBy: hostId,
          recurring: false,
          isClosing: true,
        }))
        // Un seul geste : le groupe, son hote et ses taches arrivent ensemble
        // ou pas du tout.
        dispatch(() => ({
          type: 'addGroup',
          group: created,
          membership: {
            id: uid('ms'),
            groupId: id,
            accountId: hostId,
            role: 'host' as Role,
            hasLicense: input.hasLicense,
            joinedAt: now,
          },
          closingTasks,
        }))
        // On ne bascule pas tout de suite dans le groupe : l'ecran d'invitation
        // vient d'abord, c'est lui qui appelle selectGroup ensuite.
        return created
      },

      joinByCode: (code) => {
        if (!account) return { ok: false, error: 'notSignedIn' }
        const target = data.groups.find((g) => g.inviteCode.toUpperCase() === code.trim().toUpperCase())
        if (!target) return { ok: false, error: 'unknownCode' }
        dispatch(() => ({
          type: 'addMembership',
          membership: {
            id: uid('ms'),
            groupId: target.id,
            accountId: account.id,
            role: 'member' as Role,
            hasLicense: false,
            joinedAt: new Date().toISOString(),
          },
        }))
        localStorage.setItem(GROUP_KEY, target.id)
        setGroupId(target.id)
        return { ok: true }
      },

      // Desactivee : chercher qui possede une adresse permettrait de tester des
      // adresses pour savoir qui a un compte ici. Le code d'invitation suffit.
      inviteByEmail: () => ({ ok: false, error: 'inviteByEmailDisabled' }),

      leaveGroup: (id, newHostId) => {
        if (!account) return { ok: false, error: 'notSignedIn' }
        const mine = data.memberships.find((m) => m.groupId === id && m.accountId === account.id)
        if (!mine) return { ok: false, error: 'notMember' }

        const others = data.memberships.filter((m) => m.groupId === id && m.accountId !== account.id)
        const forget = () => {
          if (groupId === id) {
            localStorage.removeItem(GROUP_KEY)
            setGroupId(null)
          }
        }

        // Un simple membre part sans ceremonie.
        if (mine.role !== 'host') {
          dispatch(() => ({ type: 'removeMembership', groupId: id, accountId: account.id }))
          forget()
          return { ok: true }
        }

        // Plus personne ne reste : le groupe disparait. Le garder laisserait un
        // code d'invitation actif que plus personne ne peut fermer.
        if (others.length === 0) {
          dispatch(() => ({ type: 'removeGroup', groupId: id }))
          forget()
          return { ok: true }
        }

        // Une seule personne reste : inutile de le lui demander, c'est elle.
        const heir =
          others.length === 1 ? others[0].accountId : others.find((m) => m.accountId === newHostId)?.accountId
        if (!heir) {
          return { ok: false, error: newHostId ? 'newHostNotMember' : 'chooseNewHost' }
        }

        dispatch(() => [
          { type: 'setRole', groupId: id, accountId: heir, role: 'host' as Role },
          { type: 'updateGroup', groupId: id, patch: { hostId: heir } },
          { type: 'removeMembership', groupId: id, accountId: account.id },
        ])
        forget()
        return { ok: true }
      },

      updateGroup: (patch) => {
        const current = requireGroup()
        if (!current) return
        dispatch(() => ({ type: 'updateGroup', groupId: current.id, patch }))
      },

      setRole: (targetId, role) => {
        const current = requireGroup()
        if (!current) return
        dispatch(() => ({ type: 'setRole', groupId: current.id, accountId: targetId, role }))
      },

      setLicense: (targetId, hasLicense) => {
        const current = requireGroup()
        if (!current) return
        dispatch(() => ({ type: 'setLicense', groupId: current.id, accountId: targetId, hasLicense }))
      },

      addTask: (task) => {
        const current = requireGroup()
        if (!current) return
        dispatch(() => ({
          type: 'addTask',
          task: { ...task, id: uid('t'), groupId: current.id, status: 'todo' },
        }))
      },

      takeTask: (taskId, who) => {
        dispatch(() => ({ type: 'assignTask', taskId, accountId: who }))
      },

      validateTask: (taskId, doerIds, beneficiaryIds) => {
        if (doerIds.length === 0 || beneficiaryIds.length === 0) return
        const current = requireGroup()
        if (!current || !account) return
        dispatch((d) => {
          const task = d.tasks.find((x) => x.id === taskId)
          if (!task) return null
          return {
            type: 'settleTask',
            taskId,
            status: 'done',
            entry: {
              id: uid('e'),
              groupId: current.id,
              taskId,
              kind: 'completion',
              doerIds,
              beneficiaryIds,
              amounts: completionAmounts(task.points, doerIds, beneficiaryIds),
              validatedBy: account.id,
              at: new Date().toISOString(),
            },
          }
        })
      },

      // Le malus ne s'applique que si quelqu'un s'etait engage sur la tache.
      markMissed: (taskId) => {
        const current = requireGroup()
        if (!current || !account || !view) return
        dispatch((d) => {
          const task = d.tasks.find((x) => x.id === taskId)
          if (!task || !task.assignedTo) return null
          const beneficiaryIds = beneficiariesOf(task, view!.members)
          return {
            type: 'settleTask',
            taskId,
            status: 'missed',
            entry: {
              id: uid('e'),
              groupId: current.id,
              taskId,
              kind: 'penalty',
              doerIds: [],
              beneficiaryIds,
              amounts: penaltyAmounts(current.penalty, task.assignedTo, beneficiaryIds),
              validatedBy: account.id,
              at: new Date().toISOString(),
            },
          }
        })
      },

      reopenTask: (taskId) => {
        dispatch(() => ({ type: 'reopenTask', taskId }))
      },

      deleteTask: (taskId) => {
        dispatch(() => ({ type: 'deleteTask', taskId }))
      },

      // Le bouton reste une bascule, mais ce qui part sur le reseau est la
      // valeur voulue : deux telephones qui appuient en meme temps tombent
      // d'accord, au lieu de s'annuler.
      toggleRecurring: (taskId) => {
        dispatch((d) => {
          const task = d.tasks.find((x) => x.id === taskId)
          return task ? { type: 'setRecurring', taskId, recurring: !task.recurring } : null
        })
      },
    }
  }, [data, accountId, groupId, conceptSeen, lang, theme, t, dispatch])

  if (!value) return null
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp doit être utilisé dans AppProvider')
  return ctx
}

/** Raccourci pour les ecrans qui tournent forcement dans un groupe. */
export function useGroup() {
  const ctx = useApp()
  if (!ctx.view) throw new Error('useGroup doit être utilisé dans un groupe')
  return { ...ctx, view: ctx.view, state: ctx.view }
}

export function useBalances() {
  const { view } = useApp()
  return useMemo(() => (view ? balances(view) : []), [view])
}

export { fullName }
