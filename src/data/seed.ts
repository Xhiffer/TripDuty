import type { TaskStatus, TripState } from '../types'
import { CATALOG } from '../lib/catalog'

// Donnees de demonstration, remplacees par les vraies donnees partagees
// quand la base en ligne sera branchee.

const TRIP_START = '2026-08-22'
const TRIP_END = '2026-08-29'

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

  // Le sejour a deja commence sur la demo, pour que le classement soit vivant.
  const planned: Array<[string, string, string, string | null]> = [
    // cle, jour, heure, attribuee a
    ['breakfast', TRIP_START, '08:30', byName('Lola')],
    ['big_groceries', TRIP_START, '10:00', byName('Ismaël')],
    ['cook_meal', TRIP_START, '19:00', byName('Camille')],
    ['dishes_dinner', TRIP_START, '21:00', byName('Martin')],
    ['bins', TRIP_START, '21:30', byName('Hugo')],
    ['breakfast', '2026-08-23', '08:30', byName('Sarah')],
    ['drive_long', '2026-08-23', '10:00', byName('Cajun')],
    ['plan_outing', '2026-08-23', '11:00', byName('Théo')],
    ['cook_meal', '2026-08-23', '19:00', byName('Lola')],
    ['dishes_dinner', '2026-08-23', '21:00', null],
    ['bread', '2026-08-24', '08:00', null],
    ['tidy_kitchen', '2026-08-24', '14:00', null],
    ['deep_clean', '2026-08-24', '16:00', null],
    ['host_game', '2026-08-24', '21:00', null],
    ['suggest_activity', '2026-08-24', '22:00', null],
  ]

  const tasks = planned.map(([key, date, time, assignedTo], i) => {
    const c = entry(key)
    return {
      id: `t${i + 1}`,
      title: c.fr,
      titleKey: c.key,
      emoji: c.emoji,
      points: c.points,
      date,
      time,
      needsLicense: c.needsLicense,
      assignedTo,
      autoAssigned: false,
      status: 'todo' as TaskStatus,
      createdBy: byName('Ismaël'),
      recurring: key === 'breakfast' || key === 'dishes_dinner',
    }
  })

  // Quelques taches deja validees pour que le podium ait du relief.
  const doneSpecs: Array<[string, string[], string]> = [
    ['t1', [byName('Lola')], '2026-08-22T09:10:00.000Z'],
    ['t2', [byName('Ismaël'), byName('Théo')], '2026-08-22T11:30:00.000Z'],
    ['t3', [byName('Camille'), byName('Sarah')], '2026-08-22T20:10:00.000Z'],
    ['t4', [byName('Martin')], '2026-08-22T21:40:00.000Z'],
    ['t6', [byName('Sarah')], '2026-08-23T08:50:00.000Z'],
    ['t7', [byName('Cajun')], '2026-08-23T12:00:00.000Z'],
    ['t8', [byName('Théo')], '2026-08-23T11:45:00.000Z'],
    ['t9', [byName('Lola'), byName('Manon')], '2026-08-23T20:15:00.000Z'],
  ]

  const completions = doneSpecs.map(([taskId, participantIds, at], i) => {
    const task = tasks.find((t) => t.id === taskId)!
    task.status = 'done'
    return {
      id: `c${i + 1}`,
      taskId,
      participantIds,
      pointsEach: Math.floor(task.points / participantIds.length),
      validatedBy: byName('Ismaël'),
      at,
    }
  })

  // Hugo n'a pas sorti les poubelles.
  const missed = tasks.find((t) => t.id === 't5')!
  missed.status = 'missed'
  const penalties = [
    {
      id: 'p1',
      taskId: 't5',
      memberId: byName('Hugo'),
      points: -30,
      at: '2026-08-23T09:00:00.000Z',
    },
  ]

  return {
    trip: {
      id: 'trip1',
      name: 'Gorges du Verdon',
      startDate: TRIP_START,
      endDate: TRIP_END,
      ownerId: byName('Ismaël'),
      penalty: 30,
    },
    members,
    tasks,
    completions,
    penalties,
  }
}
