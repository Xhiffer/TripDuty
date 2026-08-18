import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { Account, Group, GroupKind, GroupView, Lang, Person, Role, Task, Theme } from './types'
import { ApiError, api, type GroupSummary } from './data/api'
import { balances } from './lib/ledger'
import { translator } from './lib/i18n'

const GROUP_KEY = 'tripduty:group'
const LANG_KEY = 'tripduty:lang'
const THEME_KEY = 'tripduty:theme'
const CONCEPT_KEY = 'tripduty:concept-seen'

/** Toutes les 4 secondes, on demande juste au serveur si quelque chose a bouge. */
const POLL_MS = 4000

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

async function attempt(run: () => Promise<unknown>): Promise<Result> {
  try {
    await run()
    return { ok: true }
  } catch (error) {
    return { ok: false, error: error instanceof ApiError ? error.code : 'serverError' }
  }
}

interface Ctx {
  loading: boolean
  offline: boolean
  account: Account | null
  view: GroupView | null
  me: Person | null
  isChef: boolean
  isHost: boolean
  myGroups: GroupSummary[]
  conceptSeen: boolean
  lang: Lang
  theme: Theme
  t: (key: string) => string
  activeDate: string
  setLang: (l: Lang) => void
  setTheme: (th: Theme) => void
  signUp: (email: string, password: string) => Promise<Result>
  signIn: (email: string, password: string) => Promise<Result>
  signOut: () => void
  updateProfile: (patch: Partial<Account>) => void
  markConceptSeen: () => void
  selectGroup: (groupId: string | null) => void
  createGroup: (input: {
    kind: GroupKind
    name: string
    emoji: string
    color: string
    startDate: string
    endDate: string
    hasLicense: boolean
  }) => Promise<Group | null>
  joinByCode: (code: string) => Promise<Result>
  inviteByEmail: (email: string) => Promise<Result>
  leaveGroup: (groupId: string) => void
  updateGroup: (patch: Partial<Group>) => void
  setRole: (accountId: string, role: Role) => void
  setLicense: (accountId: string, hasLicense: boolean) => void
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
  const [loading, setLoading] = useState(true)
  const [offline, setOffline] = useState(false)
  const [account, setAccount] = useState<Account | null>(null)
  const [myGroups, setMyGroups] = useState<GroupSummary[]>([])
  const [view, setView] = useState<GroupView | null>(null)
  const [groupId, setGroupId] = useState<string | null>(() => localStorage.getItem(GROUP_KEY))
  const [conceptSeen, setConceptSeen] = useState(() => localStorage.getItem(CONCEPT_KEY) === '1')
  const [lang, setLangState] = useState<Lang>(() => (localStorage.getItem(LANG_KEY) as Lang) || 'fr')
  const [theme, setThemeState] = useState<Theme>(() => (localStorage.getItem(THEME_KEY) as Theme) || 'dark')
  const version = useRef(0)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.documentElement.lang = lang
  }, [theme, lang])

  const loadAccount = useCallback(async () => {
    try {
      const { account: me, groups } = await api.me()
      setAccount(me)
      setMyGroups(groups)
      setOffline(false)
      return groups
    } catch (error) {
      if (error instanceof ApiError && error.code === 'notSignedIn') {
        setAccount(null)
        setMyGroups([])
        setOffline(false)
      } else {
        setOffline(true)
      }
      return []
    }
  }, [])

  const loadGroup = useCallback(async (id: string) => {
    try {
      const remote = await api.group(id)
      version.current = remote.version
      setView({ group: remote.group, members: remote.members, tasks: remote.tasks, entries: remote.entries })
      setOffline(false)
    } catch (error) {
      if (error instanceof ApiError && error.code === 'notInGroup') {
        localStorage.removeItem(GROUP_KEY)
        setGroupId(null)
        setView(null)
      } else if (!(error instanceof ApiError)) {
        setOffline(true)
      }
    }
  }, [])

  useEffect(() => {
    void (async () => {
      const groups = await loadAccount()
      const wanted = localStorage.getItem(GROUP_KEY)
      if (wanted && groups.some((g) => g.id === wanted)) await loadGroup(wanted)
      setLoading(false)
    })()
  }, [loadAccount, loadGroup])

  useEffect(() => {
    if (!groupId) {
      setView(null)
      return
    }
    void loadGroup(groupId)
  }, [groupId, loadGroup])

  // Les autres telephones bougent aussi : on verifie regulierement.
  useEffect(() => {
    if (!groupId || !account) return
    let stopped = false
    const timer = setInterval(async () => {
      if (document.hidden || stopped) return
      try {
        const { version: remote } = await api.version(groupId)
        setOffline(false)
        if (remote !== version.current) await loadGroup(groupId)
      } catch {
        setOffline(true)
      }
    }, POLL_MS)
    return () => {
      stopped = true
      clearInterval(timer)
    }
  }, [groupId, account, loadGroup])

  const refresh = useCallback(async () => {
    if (groupId) await loadGroup(groupId)
    await loadAccount()
  }, [groupId, loadAccount, loadGroup])

  /** Lance une ecriture puis recharge, sans bloquer l'ecran qui l'a demandee. */
  const run = useCallback(
    (action: () => Promise<unknown>) => {
      void action()
        .then(() => refresh())
        .catch(() => setOffline(true))
    },
    [refresh],
  )

  const t = useMemo(() => translator(lang), [lang])

  const value = useMemo<Ctx>(() => {
    const me = view?.members.find((m) => m.id === account?.id) ?? null
    const isHost = !!me && me.role === 'host'
    const isChef = !!me && (me.role === 'host' || me.role === 'chef')
    const current = view?.group ?? null

    return {
      loading,
      offline,
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
      activeDate: current ? activeDateFor(current) : todayISO(),
      setLang: (l) => {
        localStorage.setItem(LANG_KEY, l)
        setLangState(l)
      },
      setTheme: (th) => {
        localStorage.setItem(THEME_KEY, th)
        setThemeState(th)
      },

      signUp: async (email, password) => {
        const result = await attempt(() => api.signUp(email, password))
        if (result.ok) await loadAccount()
        return result
      },

      signIn: async (email, password) => {
        const result = await attempt(() => api.signIn(email, password))
        if (result.ok) await loadAccount()
        return result
      },

      signOut: () => {
        void api.signOut().finally(() => {
          localStorage.removeItem(GROUP_KEY)
          setGroupId(null)
          setView(null)
          setAccount(null)
          setMyGroups([])
        })
      },

      updateProfile: (patch) => run(() => api.updateProfile(patch)),

      markConceptSeen: () => {
        localStorage.setItem(CONCEPT_KEY, '1')
        setConceptSeen(true)
      },

      selectGroup: (id) => {
        if (id) localStorage.setItem(GROUP_KEY, id)
        else localStorage.removeItem(GROUP_KEY)
        setGroupId(id)
      },

      createGroup: async (input) => {
        try {
          const { group } = await api.createGroup(input)
          await loadAccount()
          return group
        } catch {
          return null
        }
      },

      joinByCode: async (code) => {
        const result = await attempt(async () => {
          const { group } = await api.joinByCode(code)
          localStorage.setItem(GROUP_KEY, group.id)
          setGroupId(group.id)
        })
        if (result.ok) await loadAccount()
        return result
      },

      inviteByEmail: async (email) => {
        if (!current) return { ok: false, error: 'noGroup' }
        const result = await attempt(() => api.invite(current.id, email))
        if (result.ok) await refresh()
        return result
      },

      leaveGroup: (id) => {
        run(async () => {
          await api.leave(id)
          localStorage.removeItem(GROUP_KEY)
          setGroupId(null)
          setView(null)
        })
      },

      updateGroup: (patch) => {
        if (!current) return
        run(() => api.updateGroup(current.id, patch))
      },

      setRole: (targetId, role) => {
        if (!current) return
        run(() => api.setMember(current.id, targetId, { role }))
      },

      setLicense: (targetId, hasLicense) => {
        if (!current) return
        run(() => api.setMember(current.id, targetId, { hasLicense }))
      },

      addTask: (task) => {
        if (!current) return
        run(() => api.addTask(current.id, task))
      },

      takeTask: (taskId, who) => {
        if (!current) return
        run(() => api.patchTask(current.id, taskId, { assignedTo: who }))
      },

      validateTask: (taskId, doerIds, beneficiaryIds) => {
        if (!current) return
        run(() => api.validateTask(current.id, taskId, doerIds, beneficiaryIds))
      },

      markMissed: (taskId) => {
        if (!current) return
        run(() => api.missTask(current.id, taskId))
      },

      reopenTask: (taskId) => {
        if (!current) return
        run(() => api.reopenTask(current.id, taskId))
      },

      deleteTask: (taskId) => {
        if (!current) return
        run(() => api.deleteTask(current.id, taskId))
      },

      toggleRecurring: (taskId) => {
        if (!current) return
        const task = view?.tasks.find((x) => x.id === taskId)
        run(() => api.patchTask(current.id, taskId, { recurring: !task?.recurring }))
      },
    }
  }, [loading, offline, account, view, myGroups, conceptSeen, lang, theme, t, loadAccount, refresh, run])

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
