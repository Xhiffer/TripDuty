import type { AppData, Entry, Membership, Task, TaskStatus } from '../types'
import { CATALOG } from '../lib/catalog'
import { CLOSING_CATALOG } from '../lib/closing'
import { completionAmounts, penaltyAmounts } from '../lib/ledger'
import { AVATAR_COLORS } from '../lib/identity'

// Donnees de demonstration, remplacees par les vraies donnees partagees
// quand la base en ligne sera branchee.
// Mot de passe de tous les comptes de demonstration : verdon2026

const DEMO_HASH = '890368b5b3ce6ba82550b4e711c504ce7038933f7eebc340e32ab43ae29a1f33'
const TRIP_START = '2026-08-22'
const TRIP_END = '2026-08-29'
const PENALTY = 30
const GROUP_ID = 'g1'

const PEOPLE: Array<[string, string, string, boolean, 'host' | 'chef' | 'member']> = [
  ['Ismaël', 'Frihi', '1996-04-12', true, 'host'],
  ['Lola', 'Bernard', '1997-09-03', true, 'chef'],
  ['Matthew', 'Morel', '1995-01-27', true, 'member'],
  ['Kejian', 'Dupuis', '1998-06-15', false, 'member'],
  ['Said', 'Roche', '1996-11-08', false, 'member'],
  ['Martin', 'Lambert', '1999-02-21', false, 'member'],
  ['Jack', 'Nguyen', '1997-07-30', false, 'member'],
  ['Victor', 'Petit', '1994-12-05', false, 'member'],
  ['Charlie', 'Girard', '1998-03-17', false, 'member'],
  ['Nina', 'Costa', '1996-05-24', false, 'member'],
]

function entry(key: string) {
  const found = CATALOG.find((c) => c.key === key)
  if (!found) throw new Error(`Tâche inconnue dans le catalogue : ${key}`)
  return found
}

export function seedData(): AppData {
  const accounts = PEOPLE.map(([firstName, lastName, birthDate], i) => ({
    id: `a${i + 1}`,
    email: `${firstName.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')}@demo.fr`,
    passwordHash: DEMO_HASH,
    firstName,
    lastName,
    nickname: '',
    birthDate,
    photo: null,
    color: AVATAR_COLORS[i % AVATAR_COLORS.length],
    createdAt: `2026-08-0${(i % 9) + 1}T10:00:00.000Z`,
  }))

  const memberships: Membership[] = PEOPLE.map(([, , , hasLicense, role], i) => ({
    id: `ms${i + 1}`,
    groupId: GROUP_ID,
    accountId: `a${i + 1}`,
    role,
    hasLicense,
    joinedAt: `2026-08-1${i}T10:00:00.000Z`,
  }))

  const byName = (n: string) => accounts.find((a) => a.firstName === n)!.id

  interface Plan {
    key: string
    date: string
    time: string
    forWhom?: string[] | null
    takenBy?: string | null
    /** Qui l'a faite. Renseigne, la tache est validee et compte des points. */
    doneBy?: string[]
    at?: string
  }

  const planned: Plan[] = [
    // --- samedi 22, l'arrivee
    { key: 'big_groceries', date: TRIP_START, time: '10:00', takenBy: byName('Ismaël'), doneBy: [byName('Ismaël'), byName('Nina')], at: '2026-08-22T11:30:00.000Z' },
    { key: 'cook_meal', date: TRIP_START, time: '19:00', takenBy: byName('Said'), doneBy: [byName('Said'), byName('Charlie')], at: '2026-08-22T20:10:00.000Z' },
    { key: 'dishes_dinner', date: TRIP_START, time: '21:00', takenBy: byName('Kejian'), doneBy: [byName('Kejian')], at: '2026-08-22T21:40:00.000Z' },
    { key: 'bins', date: TRIP_START, time: '21:30', takenBy: byName('Victor') },
    { key: 'breakfast', date: TRIP_START, time: '08:30', takenBy: byName('Lola'), doneBy: [byName('Lola')], at: '2026-08-22T09:10:00.000Z' },
    { key: 'table', date: TRIP_START, time: '18:45', takenBy: null },
    { key: 'host_game', date: TRIP_START, time: '22:00', takenBy: byName('Martin'), doneBy: [byName('Martin')], at: '2026-08-22T23:30:00.000Z' },

    // --- dimanche 23
    { key: 'breakfast', date: '2026-08-23', time: '08:30', takenBy: byName('Nina'), doneBy: [byName('Nina')], at: '2026-08-23T08:55:00.000Z' },
    // Petit-dejeuner tardif prepare par Jack, pour ceux qui se sont leves tard.
    {
      key: 'breakfast',
      date: '2026-08-23',
      time: '10:30',
      forWhom: [byName('Jack'), byName('Kejian'), byName('Said'), byName('Martin')],
      takenBy: byName('Jack'),
      doneBy: [byName('Jack')],
      at: '2026-08-23T10:50:00.000Z',
    },
    { key: 'drive_long', date: '2026-08-23', time: '11:00', takenBy: byName('Matthew'), doneBy: [byName('Matthew')], at: '2026-08-23T12:00:00.000Z' },
    { key: 'plan_outing', date: '2026-08-23', time: '12:00', takenBy: byName('Martin'), doneBy: [byName('Martin')], at: '2026-08-23T11:45:00.000Z' },
    { key: 'cook_meal', date: '2026-08-23', time: '19:00', takenBy: byName('Lola'), doneBy: [byName('Lola'), byName('Charlie')], at: '2026-08-23T20:15:00.000Z' },
    { key: 'dishes_dinner', date: '2026-08-23', time: '21:00', takenBy: byName('Nina'), doneBy: [byName('Nina')], at: '2026-08-23T21:30:00.000Z' },
    { key: 'bathroom', date: '2026-08-23', time: '17:00', takenBy: byName('Charlie'), doneBy: [byName('Charlie')], at: '2026-08-23T17:40:00.000Z' },
    // Ismael rentre tard et se fait son sandwich tout seul : personne ne bouge.
    { key: 'cook_meal', date: '2026-08-23', time: '23:00', forWhom: [byName('Ismaël')], takenBy: byName('Ismaël'), doneBy: [byName('Ismaël')], at: '2026-08-23T23:20:00.000Z' },

    // --- lundi 24, rien n'est encore pris
    { key: 'bread', date: '2026-08-24', time: '08:00', takenBy: null },
    { key: 'tidy_kitchen', date: '2026-08-24', time: '14:00', takenBy: null },
    { key: 'deep_clean', date: '2026-08-24', time: '16:00', takenBy: null },
    { key: 'laundry', date: '2026-08-24', time: '17:00', takenBy: null },
    { key: 'small_groceries', date: '2026-08-24', time: '18:00', takenBy: null },
    { key: 'host_game', date: '2026-08-24', time: '21:00', takenBy: null },
    { key: 'suggest_activity', date: '2026-08-24', time: '22:00', takenBy: null },
  ]

  const tasks: Task[] = planned.map((plan, i) => {
    const c = entry(plan.key)
    return {
      id: `t${i + 1}`,
      groupId: GROUP_ID,
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

  CLOSING_CATALOG.forEach((c, i) => {
    tasks.push({
      id: `k${i + 1}`,
      groupId: GROUP_ID,
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

  const all = accounts.map((a) => a.id)
  const entries: Entry[] = []

  function validate(taskId: string, doerIds: string[], at: string) {
    const task = tasks.find((t) => t.id === taskId)!
    task.status = 'done'
    const beneficiaryIds = task.beneficiaryIds ?? all
    entries.push({
      id: `e${entries.length + 1}`,
      groupId: GROUP_ID,
      taskId,
      kind: 'completion',
      doerIds,
      beneficiaryIds,
      amounts: completionAmounts(task.points, doerIds, beneficiaryIds),
      validatedBy: byName('Ismaël'),
      at,
    })
  }

  planned.forEach((plan, i) => {
    if (plan.doneBy) validate(`t${i + 1}`, plan.doneBy, plan.at ?? '2026-08-22T12:00:00.000Z')
  })

  // Victor s'etait engage sur les poubelles et ne les a pas sorties.
  const missed = tasks.find((t) => t.titleKey === 'bins')!
  missed.status = 'missed'
  entries.push({
    id: `e${entries.length + 1}`,
    groupId: GROUP_ID,
    taskId: missed.id,
    kind: 'penalty',
    doerIds: [],
    beneficiaryIds: all,
    amounts: penaltyAmounts(PENALTY, byName('Victor'), all),
    validatedBy: byName('Ismaël'),
    at: '2026-08-23T09:00:00.000Z',
  })

  return {
    accounts,
    groups: [
      {
        id: GROUP_ID,
        kind: 'vacances',
        name: 'Gorges du Verdon',
        emoji: '⛰️',
        color: '#ff6a3d',
        startDate: TRIP_START,
        endDate: TRIP_END,
        hostId: byName('Ismaël'),
        inviteCode: 'VERDON',
        penalty: PENALTY,
        closingOpen: false,
        createdAt: '2026-08-10T10:00:00.000Z',
      },
    ],
    memberships,
    tasks,
    entries,
  }
}
