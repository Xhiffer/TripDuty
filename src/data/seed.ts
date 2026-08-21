import type { AppData, Entry, Expense, Membership, Task, TaskStatus } from '../types'
import { CATALOG } from '../lib/catalog'
import { CLOSING_CATALOG } from '../lib/closing'
import { completionAmounts, penaltyAmounts } from '../lib/ledger'
import { AVATAR_COLORS } from '../lib/identity'

/**
 * Le groupe de demonstration, ouvert par ?demo=1.
 *
 * Dix personnes, une semaine, une cinquantaine de taches et huit depenses : de
 * quoi voir a quoi ressemblent les ecrans pleins, ce qu'aucune capture ne
 * montre. Les dates se calculent a partir d'aujourd'hui plutot que d'etre
 * ecrites en dur : sinon la demonstration vieillit, le sejour se retrouve dans
 * le passe, et on ne regarde plus le seul cas qui compte, celui d'un groupe en
 * cours.
 *
 * Mot de passe de tous les comptes de demonstration : verdon2026
 */

const DEMO_HASH = '890368b5b3ce6ba82550b4e711c504ce7038933f7eebc340e32ab43ae29a1f33'
const PENALTY = 30
const GROUP_ID = 'g1'

/** Le sejour commence deux jours avant aujourd'hui et finit cinq jours apres. */
const FIRST_DAY = -2
const LAST_DAY = 5

/** Le jour situe a `offset` jours d'aujourd'hui, au format AAAA-MM-JJ. */
function isoDay(offset: number): string {
  const d = new Date()
  d.setHours(12, 0, 0, 0)
  d.setDate(d.getDate() + offset)
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

/** Un horodatage dans la journee, pour dater les validations. */
function isoAt(offset: number, time: string): string {
  return new Date(`${isoDay(offset)}T${time}:00`).toISOString()
}

const TRIP_START = isoDay(FIRST_DAY)
const TRIP_END = isoDay(LAST_DAY)

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
  const found = CATALOG.find((c) => c.key === key) ?? CLOSING_CATALOG.find((c) => c.key === key)
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
    createdAt: isoAt(FIRST_DAY - 12, '10:00'),
  }))

  const memberships: Membership[] = PEOPLE.map(([, , , hasLicense, role], i) => ({
    id: `ms${i + 1}`,
    groupId: GROUP_ID,
    accountId: `a${i + 1}`,
    role,
    hasLicense,
    joinedAt: isoAt(FIRST_DAY - 10 + i, '10:00'),
  }))

  const byName = (n: string) => accounts.find((a) => a.firstName === n)!.id

  interface Plan {
    key: string
    /** Jour du sejour, compte depuis aujourd'hui : -2 est le premier jour. */
    day: number
    time: string
    forWhom?: string[] | null
    takenBy?: string | null
    /** Qui l'a faite. Renseigne, la tache est validee et compte des points. */
    doneBy?: string[]
    /** Heure de la validation. */
    at?: string
  }

  const planned: Plan[] = [
    // --- l'arrivee, avant-hier
    { key: 'breakfast', day: -2, time: '08:30', takenBy: byName('Lola'), doneBy: [byName('Lola')], at: '09:10' },
    {
      key: 'big_groceries',
      day: -2,
      time: '10:00',
      takenBy: byName('Ismaël'),
      doneBy: [byName('Ismaël'), byName('Nina')],
      at: '11:30',
    },
    { key: 'table', day: -2, time: '18:45', takenBy: byName('Jack'), doneBy: [byName('Jack')], at: '19:05' },
    {
      key: 'cook_meal',
      day: -2,
      time: '19:00',
      takenBy: byName('Said'),
      doneBy: [byName('Said'), byName('Charlie')],
      at: '20:10',
    },
    {
      key: 'dishes_dinner',
      day: -2,
      time: '21:00',
      takenBy: byName('Kejian'),
      doneBy: [byName('Kejian')],
      at: '21:40',
    },
    { key: 'bins', day: -2, time: '21:30', takenBy: byName('Victor') },
    { key: 'host_game', day: -2, time: '22:00', takenBy: byName('Martin'), doneBy: [byName('Martin')], at: '23:30' },

    // --- hier
    { key: 'breakfast', day: -1, time: '08:30', takenBy: byName('Nina'), doneBy: [byName('Nina')], at: '08:55' },
    // Petit-dejeuner tardif prepare par Jack, pour ceux qui se sont leves tard.
    {
      key: 'breakfast',
      day: -1,
      time: '10:30',
      forWhom: [byName('Jack'), byName('Kejian'), byName('Said'), byName('Martin')],
      takenBy: byName('Jack'),
      doneBy: [byName('Jack')],
      at: '10:50',
    },
    { key: 'drive_long', day: -1, time: '11:00', takenBy: byName('Matthew'), doneBy: [byName('Matthew')], at: '12:00' },
    { key: 'plan_outing', day: -1, time: '12:00', takenBy: byName('Martin'), doneBy: [byName('Martin')], at: '11:45' },
    { key: 'dishes_lunch', day: -1, time: '14:00', takenBy: byName('Victor'), doneBy: [byName('Victor')], at: '14:25' },
    { key: 'bathroom', day: -1, time: '17:00', takenBy: byName('Charlie'), doneBy: [byName('Charlie')], at: '17:40' },
    {
      key: 'cook_meal',
      day: -1,
      time: '19:00',
      takenBy: byName('Lola'),
      doneBy: [byName('Lola'), byName('Charlie')],
      at: '20:15',
    },
    { key: 'dishes_dinner', day: -1, time: '21:00', takenBy: byName('Nina'), doneBy: [byName('Nina')], at: '21:30' },
    // Ismael rentre tard et se fait son sandwich tout seul. Son solde ne bouge
    // pas d'un point : c'est le cas limite du bareme, et il se voit ici.
    {
      key: 'cook_meal',
      day: -1,
      time: '23:00',
      forWhom: [byName('Ismaël')],
      takenBy: byName('Ismaël'),
      doneBy: [byName('Ismaël')],
      at: '23:20',
    },

    // --- aujourd'hui : la matinee est faite, la soiree reste a prendre
    { key: 'bread', day: 0, time: '08:00', takenBy: byName('Kejian'), doneBy: [byName('Kejian')], at: '08:20' },
    { key: 'breakfast', day: 0, time: '08:30', takenBy: byName('Victor'), doneBy: [byName('Victor')], at: '09:00' },
    { key: 'vacuum', day: 0, time: '11:00', takenBy: byName('Jack'), doneBy: [byName('Jack')], at: '11:30' },
    { key: 'dishes_lunch', day: 0, time: '14:00', takenBy: byName('Charlie') },
    { key: 'laundry', day: 0, time: '15:00', takenBy: null },
    { key: 'small_groceries', day: 0, time: '18:00', takenBy: null },
    { key: 'cook_meal', day: 0, time: '19:00', takenBy: null },
    { key: 'table', day: 0, time: '19:15', takenBy: null },
    { key: 'dishes_dinner', day: 0, time: '21:00', takenBy: null },
    { key: 'suggest_activity', day: 0, time: '22:00', takenBy: byName('Martin') },

    // --- demain, tout est ouvert
    { key: 'bread', day: 1, time: '08:00', takenBy: null },
    { key: 'breakfast', day: 1, time: '08:30', takenBy: null },
    { key: 'drive_short', day: 1, time: '10:00', takenBy: null },
    { key: 'tidy_kitchen', day: 1, time: '14:00', takenBy: null },
    { key: 'deep_clean', day: 1, time: '16:00', takenBy: null },
    { key: 'cook_meal', day: 1, time: '19:00', takenBy: null },
    { key: 'dishes_dinner', day: 1, time: '21:00', takenBy: null },
    { key: 'host_game', day: 1, time: '21:30', takenBy: null },

    // --- apres-demain
    { key: 'breakfast', day: 2, time: '08:30', takenBy: null },
    { key: 'plan_outing', day: 2, time: '10:00', takenBy: byName('Lola') },
    { key: 'fuel', day: 2, time: '11:00', takenBy: null },
    { key: 'dishes_lunch', day: 2, time: '14:00', takenBy: null },
    { key: 'cook_meal', day: 2, time: '19:00', takenBy: null },
    { key: 'bins', day: 2, time: '20:00', takenBy: null },

    // --- la fin de la semaine
    { key: 'breakfast', day: 3, time: '08:30', takenBy: null },
    { key: 'bathroom', day: 3, time: '11:00', takenBy: null },
    { key: 'cook_meal', day: 3, time: '19:00', takenBy: null },
    { key: 'breakfast', day: 4, time: '08:30', takenBy: null },
    { key: 'laundry', day: 4, time: '10:00', takenBy: null },
    { key: 'vacuum', day: 4, time: '17:00', takenBy: null },
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
      date: isoDay(plan.day),
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
  // Quelques depenses, pour que l'ecran ne soit pas vide en demonstration.
  const spend: Array<[string, string, number, string, string[] | null, number]> = [
    // intitule, icone, centimes, payeur, participants (null = tout le monde), jour
    ['Courses du premier soir', '🛒', 18740, byName('Ismaël'), null, -2],
    ['Plein essence aller', '⛽', 9200, byName('Matthew'), null, -2],
    ['Location de la maison', '🏠', 84000, byName('Lola'), null, -2],
    ['Restaurant du soir', '🍽️', 21600, byName('Charlie'), null, -1],
    [
      'Location de kayaks',
      '🎟️',
      12000,
      byName('Nina'),
      [byName('Nina'), byName('Jack'), byName('Said'), byName('Martin')],
      -1,
    ],
    ['Bar après la rando', '🍻', 4350, byName('Said'), null, -1],
    ['Courses d’appoint', '🛒', 3280, byName('Kejian'), null, 0],
    ['Péage', '🛣️', 2740, byName('Matthew'), null, 0],
  ]

  const expenses: Expense[] = spend.map(([title, emoji, amountCents, payerId, forWhom, day], i) => ({
    id: `x${i + 1}`,
    groupId: GROUP_ID,
    title,
    emoji,
    amountCents,
    payerId,
    participantIds: forWhom ?? all,
    date: isoDay(day),
    receipt: null,
    createdBy: payerId,
    createdAt: isoAt(day, `12:0${i}`),
  }))
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
      amounts: completionAmounts(task.points, doerIds, beneficiaryIds, accounts.length),
      validatedBy: byName('Ismaël'),
      at,
    })
  }

  planned.forEach((plan, i) => {
    if (plan.doneBy) validate(`t${i + 1}`, plan.doneBy, isoAt(plan.day, plan.at ?? '12:00'))
  })

  // Victor s'etait engage sur les poubelles du premier soir et ne les a pas
  // sorties : le malus est la seule ligne negative de la demonstration.
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
    at: isoAt(-1, '09:00'),
  })

  return {
    accounts,
    groups: [
      {
        id: GROUP_ID,
        kind: 'vacances',
        name: 'Gorges du Verdon',
        emoji: '⛰️',
        photo: null,
        color: '#ff6a3d',
        startDate: TRIP_START,
        endDate: TRIP_END,
        hostId: byName('Ismaël'),
        inviteCode: 'VERDON',
        penalty: PENALTY,
        closingOpen: false,
        createdAt: isoAt(FIRST_DAY - 12, '10:00'),
      },
    ],
    memberships,
    tasks,
    entries,
    expenses,
  }
}
