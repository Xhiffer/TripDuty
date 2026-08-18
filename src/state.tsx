import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { Lang, Member, Role, Task, Theme, Trip, TripState } from './types'
import type { Mutation } from './data/mutations'
import { applyMutation } from './data/mutations'
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

  // L'etat le plus recent, lisible immediatement. `useState` ne rend la nouvelle
  // valeur qu'au rendu suivant : deux gestes rapproches liraient sinon le meme
  // etat, et le second annulerait le premier.
  const latest = useRef<TripState | null>(null)

  const receive = useCallback((next: TripState) => {
    latest.current = next
    setState(next)
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
   * `build` recoit l'etat courant parce qu'une mutation doit partir avec tout
   * ce qu'il lui faut : les points de la tache, les montants calcules,
   * l'horodatage. Une fois construite, elle ne depend plus de ce que le
   * destinataire croit savoir du sejour.
   *
   * Rendre `null` annule le geste, lorsqu'il n'a plus de sens.
   */
  const dispatch = useCallback((build: (current: TripState) => Mutation | null) => {
    const current = latest.current
    if (!current) return
    const mutation = build(current)
    if (!mutation) return

    // L'affichage n'attend pas l'ecriture : le geste apparait tout de suite.
    latest.current = applyMutation(current, mutation)
    setState(latest.current)
    void store.apply(mutation)
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
        dispatch(() => ({ type: 'addMember', member }))
        return member
      },
      addTask: (task) => {
        dispatch(() => ({ type: 'addTask', task: { ...task, id: uid('t'), status: 'todo' } }))
      },
      takeTask: (taskId, memberId) => {
        dispatch(() => ({ type: 'assignTask', taskId, memberId }))
      },
      validateTask: (taskId, doerIds, beneficiaryIds) => {
        if (doerIds.length === 0 || beneficiaryIds.length === 0) return
        dispatch((d) => {
          const task = d.tasks.find((x) => x.id === taskId)
          const author = d.members.find((m) => m.id === meId)
          if (!task || !author) return null
          return {
            type: 'settleTask',
            taskId,
            status: 'done',
            entry: {
              id: uid('e'),
              taskId,
              kind: 'completion',
              doerIds,
              beneficiaryIds,
              amounts: completionAmounts(task.points, doerIds, beneficiaryIds),
              validatedBy: author.id,
              at: new Date().toISOString(),
            },
          }
        })
      },
      // Le malus ne s'applique que si quelqu'un s'etait engage sur la tache.
      markMissed: (taskId) => {
        dispatch((d) => {
          const task = d.tasks.find((x) => x.id === taskId)
          const author = d.members.find((m) => m.id === meId)
          if (!task || !task.assignedTo || !author) return null
          const beneficiaryIds = beneficiariesOf(task, d.members)
          return {
            type: 'settleTask',
            taskId,
            status: 'missed',
            entry: {
              id: uid('e'),
              taskId,
              kind: 'penalty',
              doerIds: [],
              beneficiaryIds,
              amounts: penaltyAmounts(d.trip.penalty, task.assignedTo, beneficiaryIds),
              validatedBy: author.id,
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
      updateTrip: (patch) => {
        dispatch(() => ({ type: 'updateTrip', patch }))
      },
      setRole: (memberId, role) => {
        dispatch(() => ({ type: 'setRole', memberId, role }))
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
  }, [state, meId, lang, theme, t, dispatch])

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
