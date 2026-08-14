import type { Entry, Task, TaskStatus, TripState } from '../types'
import { CATALOG } from '../lib/catalog'
import { CLOSING_CATALOG } from '../lib/closing'
import { completionAmounts, penaltyAmounts } from '../lib/ledger'

// Donnees de demonstration, remplacees par les vraies donnees partagees
// quand la base en ligne sera branchee.

const TRIP_START = '2026-08-22'
const TRIP_END = '2026-08-29'
const PENALTY = 30

const PEOPLE: Array<[string, boolean, 'owner' | 'chef' | 'member']> = [
  ['Ismaël', true, 'owner'],
  ['Lola', true, 'chef'],
  ['Cajun', true, 'member'],
  ['Martin', false, 'member'],
  ['Camille', false, 'member'],
  ['Théo', false, 'member'],
  ['Sarah', false, 'member'],
  ['Hugo', false, 'member'],
  ['Manon', false, 'member'],
]

function entry(key: string) {
  const found = CATALOG.find((c) => c.key === key)
  if (!found) throw new Error(`Tâche inconnue dans le catalogue : ${key}`)
  return found
}

export function seedState(): TripState {
  const members = PEOPLE.map(([name, hasLicense, role], i) => ({
    id: `m${i + 1}`,
    name,
    photo: null,
    hasLicense,
    role,
    joinedAt: `2026-08-1${i < 9 ? i : 9}T10:00:00.000Z`,
  }))

  const byName = (n: string) => members.find((m) => m.name === n)!.id

  interface Plan {
    key: string
    date: string
    time: string
    /** null = pour tout le monde */
    forWhom?: string[] | null
    takenBy?: string | null
  }

  const planned: Plan[] = [
    { key: 'breakfast', date: TRIP_START, time: '08:30', takenBy: byName('Lola') },
    { key: 'big_groceries', date: TRIP_START, time: '10:00', takenBy: byName('Ismaël') },
    { key: 'cook_meal', date: TRIP_START, time: '19:00', takenBy: byName('Camille') },
    { key: 'dishes_dinner', date: TRIP_START, time: '21:00', takenBy: byName('Martin') },
    { key: 'bins', date: TRIP_START, time: '21:30', takenBy: byName('Hugo') },
    // Petit-dej tardif prepare par Sarah pour quatre personnes seulement.
    {
      key: 'breakfast',
      date: '2026-08-23',
      time: '10:30',
      forWhom: [byName('Sarah'), byName('Martin'), byName('Camille'), byName('Théo')],
      takenBy: byName('Sarah'),
    },
    { key: 'drive_long', date: '2026-08-23', time: '11:00', takenBy: byName('Cajun') },
    { key: 'plan_outing', date: '2026-08-23', time: '12:00', takenBy: byName('Théo') },
    { key: 'cook_meal', date: '2026-08-23', time: '19:00', takenBy: byName('Lola') },
    // Ismael arrive tard et se fait son sandwich tout seul : personne ne bouge.
    { key: 'cook_meal', date: '2026-08-23', time: '23:00', forWhom: [byName('Ismaël')], takenBy: byName('Ismaël') },
    { key: 'dishes_dinner', date: '2026-08-23', time: '21:00', takenBy: null },
    { key: 'bread', date: '2026-08-24', time: '08:00', takenBy: null },
    { key: 'tidy_kitchen', date: '2026-08-24', time: '14:00', takenBy: null },
    { key: 'deep_clean', date: '2026-08-24', time: '16:00', takenBy: null },
    { key: 'host_game', date: '2026-08-24', time: '21:00', takenBy: null },
    { key: 'suggest_activity', date: '2026-08-24', time: '22:00', takenBy: null },
  ]

  const tasks: Task[] = planned.map((plan, i) => {
    const c = entry(plan.key)
    return {
      id: `t${i + 1}`,
      title: c.fr,
      titleKey: c.key,
      emoji: c.emoji,
      points: c.points,
      date: plan.date,
      time: plan.time,
      needsLicense: c.needsLicense,
      beneficiaryIds: plan.forWhom ?? null,
      assignedTo: plan.takenBy ?? null,
      status: 'todo' as TaskStatus,
      createdBy: byName('Ismaël'),
      recurring: plan.key === 'breakfast' || plan.key === 'dishes_dinner',
      isClosing: false,
    }
  })

  // Les taches de cloture, pre-remplies, sur le dernier jour.
  CLOSING_CATALOG.forEach((c, i) => {
    tasks.push({
      id: `k${i + 1}`,
      title: c.fr,
      titleKey: c.key,
      emoji: c.emoji,
      points: c.points,
      date: TRIP_END,
      time: '10:00',
      needsLicense: c.needsLicense,
      beneficiaryIds: null,
      assignedTo: null,
      status: 'todo',
      createdBy: byName('Ismaël'),
      recurring: false,
      isClosing: true,
    })
  })

  const all = members.map((m) => m.id)
  const entries: Entry[] = []

  function validate(taskId: string, doerIds: string[], at: string) {
    const task = tasks.find((t) => t.id === taskId)!
    task.status = 'done'
    const beneficiaryIds = task.beneficiaryIds ?? all
    entries.push({
      id: `e${entries.length + 1}`,
      taskId,
      kind: 'completion',
      doerIds,
      beneficiaryIds,
      amounts: completionAmounts(task.points, doerIds, beneficiaryIds),
      validatedBy: byName('Ismaël'),
      at,
    })
  }

  validate('t1', [byName('Lola')], '2026-08-22T09:10:00.000Z')
  validate('t2', [byName('Ismaël'), byName('Théo')], '2026-08-22T11:30:00.000Z')
  validate('t3', [byName('Camille'), byName('Sarah')], '2026-08-22T20:10:00.000Z')
  validate('t4', [byName('Martin')], '2026-08-22T21:40:00.000Z')
  validate('t6', [byName('Sarah')], '2026-08-23T09:50:00.000Z')
  validate('t7', [byName('Cajun')], '2026-08-23T12:00:00.000Z')
  validate('t8', [byName('Théo')], '2026-08-23T11:45:00.000Z')
  validate('t9', [byName('Lola'), byName('Manon')], '2026-08-23T20:15:00.000Z')
  validate('t10', [byName('Ismaël')], '2026-08-23T23:20:00.000Z')

  // Hugo s'etait engage sur les poubelles et ne les a pas sorties.
  const missed = tasks.find((t) => t.id === 't5')!
  missed.status = 'missed'
  entries.push({
    id: `e${entries.length + 1}`,
    taskId: 't5',
    kind: 'penalty',
    doerIds: [],
    beneficiaryIds: all,
    amounts: penaltyAmounts(PENALTY, byName('Hugo'), all),
    validatedBy: byName('Ismaël'),
    at: '2026-08-23T09:00:00.000Z',
  })

  return {
    trip: {
      id: 'trip1',
      name: 'Gorges du Verdon',
      startDate: TRIP_START,
      endDate: TRIP_END,
      ownerId: byName('Ismaël'),
      penalty: PENALTY,
      closingOpen: false,
    },
    members,
    tasks,
    entries,
  }
}
