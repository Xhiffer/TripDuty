import { describe, expect, it } from 'vitest'
import type { Entry, Member, Task, TripState } from '../types'
import { applyMutation } from './mutations'

function member(id: string, role: Member['role'] = 'member'): Member {
  return { id, name: id, photo: null, hasLicense: false, role, joinedAt: '2026-08-01T10:00:00.000Z' }
}

function task(id: string, patch: Partial<Task> = {}): Task {
  return {
    id,
    title: 'Vaisselle',
    emoji: '🍽️',
    points: 10,
    date: '2026-08-22',
    time: '21:00',
    needsLicense: false,
    beneficiaryIds: null,
    assignedTo: null,
    status: 'todo',
    createdBy: 'm1',
    recurring: false,
    isClosing: false,
    ...patch,
  }
}

function entry(taskId: string, id = 'e1'): Entry {
  return {
    id,
    taskId,
    kind: 'completion',
    doerIds: ['m1'],
    beneficiaryIds: ['m1', 'm2'],
    amounts: { m1: 500, m2: -500 },
    validatedBy: 'm1',
    at: '2026-08-22T21:30:00.000Z',
  }
}

function baseState(patch: Partial<TripState> = {}): TripState {
  return {
    trip: {
      id: 'trip1',
      name: 'Verdon',
      startDate: '2026-08-22',
      endDate: '2026-08-29',
      ownerId: 'm1',
      penalty: 30,
      closingOpen: false,
    },
    members: [member('m1', 'owner'), member('m2')],
    tasks: [task('t1')],
    entries: [],
    ...patch,
  }
}

describe('applyMutation, garanties generales', () => {
  it('ne modifie jamais l etat recu', () => {
    const before = baseState()
    const snapshot = JSON.stringify(before)
    applyMutation(before, { type: 'deleteTask', taskId: 't1' })
    expect(JSON.stringify(before)).toBe(snapshot)
  })

  it('rejouer la meme mutation ne duplique rien', () => {
    const created = task('t2')
    const once = applyMutation(baseState(), { type: 'addTask', task: created })
    const twice = applyMutation(once, { type: 'addTask', task: created })
    expect(twice.tasks.filter((t) => t.id === 't2')).toHaveLength(1)
  })

  it('rejouer l arrivee d un membre ne le duplique pas', () => {
    const arrival = member('m3')
    const once = applyMutation(baseState(), { type: 'addMember', member: arrival })
    const twice = applyMutation(once, { type: 'addMember', member: arrival })
    expect(twice.members.filter((m) => m.id === 'm3')).toHaveLength(1)
  })
})

describe('taches', () => {
  it('assignTask pose et retire l engagement', () => {
    const taken = applyMutation(baseState(), { type: 'assignTask', taskId: 't1', memberId: 'm2' })
    expect(taken.tasks[0].assignedTo).toBe('m2')

    const released = applyMutation(taken, { type: 'assignTask', taskId: 't1', memberId: null })
    expect(released.tasks[0].assignedTo).toBeNull()
  })

  it('setRecurring porte une valeur, donc deux fois de suite donne le meme resultat', () => {
    const once = applyMutation(baseState(), { type: 'setRecurring', taskId: 't1', recurring: true })
    const twice = applyMutation(once, { type: 'setRecurring', taskId: 't1', recurring: true })
    expect(once.tasks[0].recurring).toBe(true)
    expect(twice.tasks[0].recurring).toBe(true)
  })

  it('supprimer une tache emporte sa ligne de compte', () => {
    const start = baseState({ entries: [entry('t1')] })
    const after = applyMutation(start, { type: 'deleteTask', taskId: 't1' })
    expect(after.tasks).toHaveLength(0)
    expect(after.entries).toHaveLength(0)
  })
})

describe('lignes de compte', () => {
  it('valider une tache la marque faite et ecrit sa ligne', () => {
    const after = applyMutation(baseState(), {
      type: 'settleTask',
      taskId: 't1',
      status: 'done',
      entry: entry('t1'),
    })
    expect(after.tasks[0].status).toBe('done')
    expect(after.entries).toHaveLength(1)
  })

  it('revalider remplace la ligne au lieu de l empiler', () => {
    const once = applyMutation(baseState(), {
      type: 'settleTask',
      taskId: 't1',
      status: 'done',
      entry: entry('t1', 'e1'),
    })
    const twice = applyMutation(once, {
      type: 'settleTask',
      taskId: 't1',
      status: 'done',
      entry: entry('t1', 'e2'),
    })
    expect(twice.entries).toHaveLength(1)
    expect(twice.entries[0].id).toBe('e2')
  })

  it('rouvrir une tache efface sa ligne', () => {
    const done = applyMutation(baseState(), {
      type: 'settleTask',
      taskId: 't1',
      status: 'done',
      entry: entry('t1'),
    })
    const reopened = applyMutation(done, { type: 'reopenTask', taskId: 't1' })
    expect(reopened.tasks[0].status).toBe('todo')
    expect(reopened.entries).toHaveLength(0)
  })

  it('valider une tache supprimee entre-temps n ecrit pas de ligne orpheline', () => {
    const deleted = applyMutation(baseState(), { type: 'deleteTask', taskId: 't1' })
    const after = applyMutation(deleted, {
      type: 'settleTask',
      taskId: 't1',
      status: 'done',
      entry: entry('t1'),
    })
    expect(after.entries).toHaveLength(0)
  })
})

describe('sejour et roles', () => {
  it('updateTrip ne touche que les champs fournis', () => {
    const after = applyMutation(baseState(), { type: 'updateTrip', patch: { closingOpen: true } })
    expect(after.trip.closingOpen).toBe(true)
    expect(after.trip.name).toBe('Verdon')
    expect(after.trip.penalty).toBe(30)
  })

  it('promeut un membre en chef', () => {
    const after = applyMutation(baseState(), { type: 'setRole', memberId: 'm2', role: 'chef' })
    expect(after.members.find((m) => m.id === 'm2')?.role).toBe('chef')
  })

  it('ne retrograde jamais le createur du sejour', () => {
    const after = applyMutation(baseState(), { type: 'setRole', memberId: 'm1', role: 'member' })
    expect(after.members.find((m) => m.id === 'm1')?.role).toBe('owner')
  })
})

/**
 * Le scenario qui a motive toute cette couche. Deux telephones partent du meme
 * etat et agissent sans se voir. Avant, chacun renvoyait le sejour entier et le
 * dernier arrive effacait le geste de l'autre.
 */
describe('deux telephones qui agissent en meme temps', () => {
  const aliceValide = { type: 'settleTask', taskId: 't1', status: 'done', entry: entry('t1') } as const
  const bobAjoute = { type: 'addTask', task: task('t2', { title: 'Pain' }) } as const

  it('conserve les deux gestes quand ils portent sur des lignes differentes', () => {
    const final = applyMutation(applyMutation(baseState(), aliceValide), bobAjoute)

    expect(final.entries).toHaveLength(1)
    expect(final.tasks.map((t) => t.id).sort()).toEqual(['t1', 't2'])
    expect(final.tasks.find((t) => t.id === 't1')?.status).toBe('done')
  })

  it('donne le meme resultat quel que soit l ordre d arrivee', () => {
    const shared = baseState()
    const aliceDAbord = applyMutation(applyMutation(shared, aliceValide), bobAjoute)
    const bobDAbord = applyMutation(applyMutation(shared, bobAjoute), aliceValide)

    expect(aliceDAbord.entries).toEqual(bobDAbord.entries)
    expect([...aliceDAbord.tasks].sort((a, b) => a.id.localeCompare(b.id))).toEqual(
      [...bobDAbord.tasks].sort((a, b) => a.id.localeCompare(b.id)),
    )
  })

  it('deux engagements sur la meme tache se resolvent sans rien perdre d autre', () => {
    const alice = applyMutation(baseState(), { type: 'assignTask', taskId: 't1', memberId: 'm1' })
    const puisBob = applyMutation(alice, { type: 'assignTask', taskId: 't1', memberId: 'm2' })

    // Une seule personne peut porter la tache : il n'y a pas de fusion possible
    // ici. Le dernier geste gagne, mais rien d'autre du sejour ne disparait.
    expect(puisBob.tasks[0].assignedTo).toBe('m2')
    expect(puisBob.tasks).toHaveLength(1)
    expect(puisBob.members).toHaveLength(2)
  })
})
