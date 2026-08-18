import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type {
  Account,
  AppData,
  Group,
  GroupKind,
  GroupView,
  Lang,
  Person,
  Role,
  Task,
  Theme,
} from './types'
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
  leaveGroup: (groupId: string) => void
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

  useEffect(() => {
    store.load().then(setData)
  }, [])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.documentElement.lang = lang
  }, [theme, lang])

  const update = useCallback((fn: (draft: AppData) => AppData) => {
    setData((current) => {
      if (!current) return current
      const next = fn(current)
      void store.save(next)
      return next
    })
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
    const belongs = !!group && !!account && data.memberships.some((m) => m.groupId === group.id && m.accountId === account.id)

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
        update((d) => ({ ...d, accounts: [...d.accounts, created] }))
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
        update((d) => ({
          ...d,
          accounts: d.accounts.map((a) => (a.id === account.id ? { ...a, ...patch } : a)),
        }))
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
        const created: Group = {
          id,
          kind: input.kind,
          name: input.name.trim(),
          emoji: input.emoji,
          color: input.color,
          startDate: input.startDate,
          endDate: input.endDate,
          hostId: account?.id ?? '',
          inviteCode: makeInviteCode(),
          penalty: 30,
          closingOpen: false,
          createdAt: new Date().toISOString(),
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
          createdBy: account?.id ?? '',
          recurring: false,
          isClosing: true,
        }))
        update((d) => ({
          ...d,
          groups: [...d.groups, created],
          tasks: [...d.tasks, ...closingTasks],
          memberships: [
            ...d.memberships,
            {
              id: uid('ms'),
              groupId: id,
              accountId: account?.id ?? '',
              role: 'host' as Role,
              hasLicense: input.hasLicense,
              joinedAt: new Date().toISOString(),
            },
          ],
        }))
        // On ne bascule pas tout de suite dans le groupe : l'ecran d'invitation
        // vient d'abord, c'est lui qui appelle selectGroup ensuite.
        return created
      },

      joinByCode: (code) => {
        if (!account) return { ok: false, error: 'notSignedIn' }
        const target = data.groups.find((g) => g.inviteCode.toUpperCase() === code.trim().toUpperCase())
        if (!target) return { ok: false, error: 'unknownCode' }
        const already = data.memberships.some((m) => m.groupId === target.id && m.accountId === account.id)
        if (!already) {
          update((d) => ({
            ...d,
            memberships: [
              ...d.memberships,
              {
                id: uid('ms'),
                groupId: target.id,
                accountId: account.id,
                role: 'member' as Role,
                hasLicense: false,
                joinedAt: new Date().toISOString(),
              },
            ],
          }))
        }
        localStorage.setItem(GROUP_KEY, target.id)
        setGroupId(target.id)
        return { ok: true }
      },

      // L'invitation par e-mail ne marche que si la personne a deja un compte.
      inviteByEmail: (email) => {
        const current = requireGroup()
        if (!current) return { ok: false, error: 'noGroup' }
        const clean = normalizeEmail(email)
        const invited = data.accounts.find((a) => normalizeEmail(a.email) === clean)
        if (!invited) return { ok: false, error: 'noAccountForEmail' }
        if (data.memberships.some((m) => m.groupId === current.id && m.accountId === invited.id)) {
          return { ok: false, error: 'alreadyMember' }
        }
        update((d) => ({
          ...d,
          memberships: [
            ...d.memberships,
            {
              id: uid('ms'),
              groupId: current.id,
              accountId: invited.id,
              role: 'member' as Role,
              hasLicense: false,
              joinedAt: new Date().toISOString(),
            },
          ],
        }))
        return { ok: true }
      },

      leaveGroup: (id) => {
        if (!account) return
        update((d) => ({
          ...d,
          memberships: d.memberships.filter((m) => !(m.groupId === id && m.accountId === account.id)),
        }))
        if (groupId === id) {
          localStorage.removeItem(GROUP_KEY)
          setGroupId(null)
        }
      },

      updateGroup: (patch) => {
        const current = requireGroup()
        if (!current) return
        update((d) => ({
          ...d,
          groups: d.groups.map((g) => (g.id === current.id ? { ...g, ...patch } : g)),
        }))
      },

      setRole: (targetId, role) => {
        const current = requireGroup()
        if (!current) return
        update((d) => ({
          ...d,
          memberships: d.memberships.map((m) =>
            m.groupId === current.id && m.accountId === targetId && m.role !== 'host' ? { ...m, role } : m,
          ),
        }))
      },

      setLicense: (targetId, hasLicense) => {
        const current = requireGroup()
        if (!current) return
        update((d) => ({
          ...d,
          memberships: d.memberships.map((m) =>
            m.groupId === current.id && m.accountId === targetId ? { ...m, hasLicense } : m,
          ),
        }))
      },

      addTask: (task) => {
        const current = requireGroup()
        if (!current) return
        update((d) => ({
          ...d,
          tasks: [...d.tasks, { ...task, id: uid('t'), groupId: current.id, status: 'todo' }],
        }))
      },

      takeTask: (taskId, who) => {
        update((d) => ({
          ...d,
          tasks: d.tasks.map((task) => (task.id === taskId ? { ...task, assignedTo: who } : task)),
        }))
      },

      validateTask: (taskId, doerIds, beneficiaryIds) => {
        if (doerIds.length === 0 || beneficiaryIds.length === 0) return
        const current = requireGroup()
        if (!current || !account) return
        update((d) => {
          const task = d.tasks.find((x) => x.id === taskId)
          if (!task) return d
          return {
            ...d,
            tasks: d.tasks.map((x) => (x.id === taskId ? { ...x, status: 'done' as const } : x)),
            entries: [
              ...d.entries.filter((e) => e.taskId !== taskId),
              {
                id: uid('e'),
                groupId: current.id,
                taskId,
                kind: 'completion' as const,
                doerIds,
                beneficiaryIds,
                amounts: completionAmounts(task.points, doerIds, beneficiaryIds),
                validatedBy: account.id,
                at: new Date().toISOString(),
              },
            ],
          }
        })
      },

      // Le malus ne s'applique que si quelqu'un s'etait engage sur la tache.
      markMissed: (taskId) => {
        const current = requireGroup()
        if (!current || !account || !view) return
        update((d) => {
          const task = d.tasks.find((x) => x.id === taskId)
          if (!task || !task.assignedTo) return d
          const beneficiaryIds = beneficiariesOf(task, view!.members)
          return {
            ...d,
            tasks: d.tasks.map((x) => (x.id === taskId ? { ...x, status: 'missed' as const } : x)),
            entries: [
              ...d.entries.filter((e) => e.taskId !== taskId),
              {
                id: uid('e'),
                groupId: current.id,
                taskId,
                kind: 'penalty' as const,
                doerIds: [],
                beneficiaryIds,
                amounts: penaltyAmounts(current.penalty, task.assignedTo, beneficiaryIds),
                validatedBy: account.id,
                at: new Date().toISOString(),
              },
            ],
          }
        })
      },

      reopenTask: (taskId) => {
        update((d) => ({
          ...d,
          tasks: d.tasks.map((x) => (x.id === taskId ? { ...x, status: 'todo' as const } : x)),
          entries: d.entries.filter((e) => e.taskId !== taskId),
        }))
      },

      deleteTask: (taskId) => {
        update((d) => ({
          ...d,
          tasks: d.tasks.filter((x) => x.id !== taskId),
          entries: d.entries.filter((e) => e.taskId !== taskId),
        }))
      },

      toggleRecurring: (taskId) => {
        update((d) => ({
          ...d,
          tasks: d.tasks.map((x) => (x.id === taskId ? { ...x, recurring: !x.recurring } : x)),
        }))
      },
    }
  }, [data, accountId, groupId, conceptSeen, lang, theme, t, update])

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
