import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { Lang, Member, Role, Task, Theme, Trip, TripState } from './types'
import { store } from './data/store'
import { balances, beneficiariesOf, completionAmounts, penaltyAmounts } from './lib/ledger'
import { translator } from './lib/i18n'

const ME_KEY = 'tripduty:me'
const LANG_KEY = 'tripduty:lang'
const THEME_KEY = 'tripduty:theme'

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
function activeDateFor(trip: Trip) {
  const today = todayISO()
  if (today < trip.startDate) return trip.startDate
  if (today > trip.endDate) return trip.endDate
  return today
}

export function tripDays(trip: Trip): string[] {
  const days: string[] = []
  const cursor = new Date(trip.startDate + 'T12:00:00')
  const end = new Date(trip.endDate + 'T12:00:00')
  while (cursor <= end) {
    const m = String(cursor.getMonth() + 1).padStart(2, '0')
    const d = String(cursor.getDate()).padStart(2, '0')
    days.push(`${cursor.getFullYear()}-${m}-${d}`)
    cursor.setDate(cursor.getDate() + 1)
  }
  return days
}

interface Ctx {
  state: TripState
  me: Member | null
  isChef: boolean
  lang: Lang
  theme: Theme
  t: (key: string) => string
  activeDate: string
  setLang: (l: Lang) => void
  setTheme: (th: Theme) => void
  setMe: (id: string | null) => void
  addMember: (name: string, photo: string | null, hasLicense: boolean) => Member
  addTask: (task: Omit<Task, 'id' | 'status'>) => void
  takeTask: (taskId: string, memberId: string | null) => void
  validateTask: (taskId: string, doerIds: string[], beneficiaryIds: string[]) => void
  markMissed: (taskId: string) => void
  reopenTask: (taskId: string) => void
  deleteTask: (taskId: string) => void
  updateTrip: (patch: Partial<Trip>) => void
  setRole: (memberId: string, role: Role) => void
  toggleRecurring: (taskId: string) => void
}

const AppContext = createContext<Ctx | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<TripState | null>(null)
  const [meId, setMeId] = useState<string | null>(() => localStorage.getItem(ME_KEY))
  const [lang, setLangState] = useState<Lang>(() => (localStorage.getItem(LANG_KEY) as Lang) || 'fr')
  const [theme, setThemeState] = useState<Theme>(() => (localStorage.getItem(THEME_KEY) as Theme) || 'dark')

  useEffect(() => {
    store.load().then(setState)
  }, [])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.documentElement.lang = lang
  }, [theme, lang])

  const update = useCallback((fn: (draft: TripState) => TripState) => {
    setState((current) => {
      if (!current) return current
      const next = fn(current)
      void store.save(next)
      return next
    })
  }, [])

  const t = useMemo(() => translator(lang), [lang])

  const value = useMemo<Ctx | null>(() => {
    if (!state) return null

    const me = state.members.find((m) => m.id === meId) ?? null
    const isChef = !!me && (me.role === 'owner' || me.role === 'chef')

    return {
      state,
      me,
      isChef,
      lang,
      theme,
      t,
      activeDate: activeDateFor(state.trip),
      setLang: (l) => {
        localStorage.setItem(LANG_KEY, l)
        setLangState(l)
      },
      setTheme: (th) => {
        localStorage.setItem(THEME_KEY, th)
        setThemeState(th)
      },
      setMe: (id) => {
        if (id) localStorage.setItem(ME_KEY, id)
        else localStorage.removeItem(ME_KEY)
        setMeId(id)
      },
      addMember: (name, photo, hasLicense) => {
        const member: Member = {
          id: uid('m'),
          name: name.trim(),
          photo,
          hasLicense,
          role: state.members.length === 0 ? 'owner' : 'member',
          joinedAt: new Date().toISOString(),
        }
        update((d) => ({ ...d, members: [...d.members, member] }))
        return member
      },
      addTask: (task) => {
        update((d) => ({ ...d, tasks: [...d.tasks, { ...task, id: uid('t'), status: 'todo' }] }))
      },
      takeTask: (taskId, memberId) => {
        update((d) => ({
          ...d,
          tasks: d.tasks.map((task) => (task.id === taskId ? { ...task, assignedTo: memberId } : task)),
        }))
      },
      validateTask: (taskId, doerIds, beneficiaryIds) => {
        if (doerIds.length === 0 || beneficiaryIds.length === 0) return
        update((d) => {
          const task = d.tasks.find((x) => x.id === taskId)
          if (!task || !me) return d
          return {
            ...d,
            tasks: d.tasks.map((x) => (x.id === taskId ? { ...x, status: 'done' as const } : x)),
            entries: [
              ...d.entries.filter((e) => e.taskId !== taskId),
              {
                id: uid('e'),
                taskId,
                kind: 'completion' as const,
                doerIds,
                beneficiaryIds,
                amounts: completionAmounts(task.points, doerIds, beneficiaryIds),
                validatedBy: me.id,
                at: new Date().toISOString(),
              },
            ],
          }
        })
      },
      // Le malus ne s'applique que si quelqu'un s'etait engage sur la tache.
      markMissed: (taskId) => {
        update((d) => {
          const task = d.tasks.find((x) => x.id === taskId)
          if (!task || !task.assignedTo || !me) return d
          const beneficiaryIds = beneficiariesOf(task, d.members)
          return {
            ...d,
            tasks: d.tasks.map((x) => (x.id === taskId ? { ...x, status: 'missed' as const } : x)),
            entries: [
              ...d.entries.filter((e) => e.taskId !== taskId),
              {
                id: uid('e'),
                taskId,
                kind: 'penalty' as const,
                doerIds: [],
                beneficiaryIds,
                amounts: penaltyAmounts(d.trip.penalty, task.assignedTo, beneficiaryIds),
                validatedBy: me.id,
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
      updateTrip: (patch) => {
        update((d) => ({ ...d, trip: { ...d.trip, ...patch } }))
      },
      setRole: (memberId, role) => {
        update((d) => ({
          ...d,
          members: d.members.map((m) => (m.id === memberId && m.role !== 'owner' ? { ...m, role } : m)),
        }))
      },
      toggleRecurring: (taskId) => {
        update((d) => ({
          ...d,
          tasks: d.tasks.map((x) => (x.id === taskId ? { ...x, recurring: !x.recurring } : x)),
        }))
      },
    }
  }, [state, meId, lang, theme, t, update])

  if (!value) return null
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp doit être utilisé dans AppProvider')
  return ctx
}

export function useBalances() {
  const { state } = useApp()
  return useMemo(() => balances(state), [state])
}
