import { describe, expect, it } from 'vitest'
import type { Account, AppData, Entry, Group, Membership, Task } from '../types'
import { applyMutation } from './mutations'

function account(id: string): Account {
  return {
    id,
    email: `${id}@demo.fr`,
    passwordHash: 'x',
    firstName: id,
    nickname: '',
    lastName: '',
    birthDate: '1996-04-12',
    photo: null,
    color: '#3d8bff',
    createdAt: '2026-08-01T10:00:00.000Z',
  }
}

const group: Group = {
  id: 'g1',
  kind: 'vacances',
  name: 'Gorges du Verdon',
  emoji: '⛰️',
  color: '#ff6a3d',
  startDate: '2026-08-22',
  endDate: '2026-08-29',
  hostId: 'a1',
  inviteCode: 'ABC234',
  penalty: 30,
  closingOpen: false,
  createdAt: '2026-08-01T10:00:00.000Z',
}

function membership(accountId: string, role: Membership['role'] = 'member'): Membership {
  return {
    id: `ms-${accountId}`,
    groupId: 'g1',
    accountId,
    role,
    hasLicense: false,
    joinedAt: '2026-08-01T10:00:00.000Z',
  }
}

function task(id: string, patch: Partial<Task> = {}): Task {
  return {
    id,
    groupId: 'g1',
    title: 'Vaisselle',
    emoji: '🍽️',
    points: 10,
    date: '2026-08-22',
    time: '21:00',
    needsLicense: false,
    beneficiaryIds: null,
    assignedTo: null,
    status: 'todo',
    createdBy: 'a1',
    recurring: false,
    isClosing: false,
    ...patch,
  }
}

function entry(taskId: string, id = 'e1'): Entry {
  return {
    id,
    groupId: 'g1',
    taskId,
    kind: 'completion',
    doerIds: ['a1'],
    beneficiaryIds: ['a1', 'a2'],
    amounts: { a1: 500, a2: -500 },
    validatedBy: 'a1',
    at: '2026-08-22T21:30:00.000Z',
  }
}

function baseData(patch: Partial<AppData> = {}): AppData {
  return {
    accounts: [account('a1'), account('a2')],
    groups: [group],
    memberships: [membership('a1', 'host'), membership('a2')],
    tasks: [task('t1')],
    entries: [],
    ...patch,
  }
}

describe('garanties generales', () => {
  it('ne modifie jamais l etat recu', () => {
    const before = baseData()
    const snapshot = JSON.stringify(before)
    applyMutation(before, { type: 'deleteTask', taskId: 't1' })
    expect(JSON.stringify(before)).toBe(snapshot)
  })

  it('rejouer une mutation ne duplique ni tache, ni compte, ni appartenance', () => {
    const t = task('t2')
    const a = account('a3')
    const m = membership('a3')
    const twiceTask = applyMutation(applyMutation(baseData(), { type: 'addTask', task: t }), {
      type: 'addTask',
      task: t,
    })
    const twiceAcc = applyMutation(applyMutation(baseData(), { type: 'addAccount', account: a }), {
      type: 'addAccount',
      account: a,
    })
    const twiceMs = applyMutation(applyMutation(baseData(), { type: 'addMembership', membership: m }), {
      type: 'addMembership',
      membership: m,
    })
    expect(twiceTask.tasks.filter((x) => x.id === 't2')).toHaveLength(1)
    expect(twiceAcc.accounts.filter((x) => x.id === 'a3')).toHaveLength(1)
    expect(twiceMs.memberships.filter((x) => x.accountId === 'a3')).toHaveLength(1)
  })
})

describe('groupes et roles', () => {
  it('creer un groupe amene son hote et ses taches de cloture ensemble', () => {
    const vide: AppData = { accounts: [account('a1')], groups: [], memberships: [], tasks: [], entries: [] }
    const after = applyMutation(vide, {
      type: 'addGroup',
      group,
      membership: membership('a1', 'host'),
      closingTasks: [task('k1', { isClosing: true })],
    })
    expect(after.groups).toHaveLength(1)
    expect(after.memberships).toHaveLength(1)
    expect(after.tasks).toHaveLength(1)
  })

  it('supprimer un groupe emporte ses appartenances, taches et ecritures', () => {
    const after = applyMutation(baseData({ entries: [entry('t1')] }), { type: 'removeGroup', groupId: 'g1' })
    expect(after.groups).toHaveLength(0)
    expect(after.memberships).toHaveLength(0)
    expect(after.tasks).toHaveLength(0)
    expect(after.entries).toHaveLength(0)
    // Les comptes survivent : ils existent independamment des groupes.
    expect(after.accounts).toHaveLength(2)
  })

  it('promeut un membre en chef', () => {
    const after = applyMutation(baseData(), { type: 'setRole', groupId: 'g1', accountId: 'a2', role: 'chef' })
    expect(after.memberships.find((m) => m.accountId === 'a2')?.role).toBe('chef')
  })

  it('ne retrograde jamais l hote', () => {
    const after = applyMutation(baseData(), { type: 'setRole', groupId: 'g1', accountId: 'a1', role: 'member' })
    expect(after.memberships.find((m) => m.accountId === 'a1')?.role).toBe('host')
  })

  it('updateGroup ne touche que les champs fournis', () => {
    const after = applyMutation(baseData(), { type: 'updateGroup', groupId: 'g1', patch: { closingOpen: true } })
    expect(after.groups[0].closingOpen).toBe(true)
    expect(after.groups[0].name).toBe('Gorges du Verdon')
    expect(after.groups[0].penalty).toBe(30)
  })
})

describe('taches et lignes de compte', () => {
  it('setRecurring porte une valeur, donc deux fois de suite donne le meme resultat', () => {
    const once = applyMutation(baseData(), { type: 'setRecurring', taskId: 't1', recurring: true })
    const twice = applyMutation(once, { type: 'setRecurring', taskId: 't1', recurring: true })
    expect(once.tasks[0].recurring).toBe(true)
    expect(twice.tasks[0].recurring).toBe(true)
  })

  it('revalider remplace la ligne au lieu de l empiler', () => {
    const once = applyMutation(baseData(), {
      type: 'settleTask',
      taskId: 't1',
      status: 'done',
      entry: entry('t1', 'e1'),
    })
    const twice = applyMutation(once, { type: 'settleTask', taskId: 't1', status: 'done', entry: entry('t1', 'e2') })
    expect(twice.entries).toHaveLength(1)
    expect(twice.entries[0].id).toBe('e2')
  })

  it('rouvrir une tache efface sa ligne', () => {
    const done = applyMutation(baseData(), { type: 'settleTask', taskId: 't1', status: 'done', entry: entry('t1') })
    const reopened = applyMutation(done, { type: 'reopenTask', taskId: 't1' })
    expect(reopened.tasks[0].status).toBe('todo')
    expect(reopened.entries).toHaveLength(0)
  })

  it('valider une tache supprimee entre-temps n ecrit pas de ligne orpheline', () => {
    const deleted = applyMutation(baseData(), { type: 'deleteTask', taskId: 't1' })
    const after = applyMutation(deleted, { type: 'settleTask', taskId: 't1', status: 'done', entry: entry('t1') })
    expect(after.entries).toHaveLength(0)
  })
})

/**
 * Le scenario qui a motive toute cette couche. Deux telephones partent du meme
 * etat et agissent sans se voir. Avant, chacun renvoyait l'etat entier et le
 * dernier arrive effacait le geste de l'autre.
 */
describe('deux telephones qui agissent en meme temps', () => {
  const aliceValide = { type: 'settleTask', taskId: 't1', status: 'done', entry: entry('t1') } as const
  const bobAjoute = { type: 'addTask', task: task('t2', { title: 'Pain' }) } as const

  it('conserve les deux gestes quand ils portent sur des lignes differentes', () => {
    const final = applyMutation(applyMutation(baseData(), aliceValide), bobAjoute)
    expect(final.entries).toHaveLength(1)
    expect(final.tasks.map((t) => t.id).sort()).toEqual(['t1', 't2'])
    expect(final.tasks.find((t) => t.id === 't1')?.status).toBe('done')
  })

  it('donne le meme resultat quel que soit l ordre d arrivee', () => {
    const shared = baseData()
    const aliceDAbord = applyMutation(applyMutation(shared, aliceValide), bobAjoute)
    const bobDAbord = applyMutation(applyMutation(shared, bobAjoute), aliceValide)
    expect(aliceDAbord.entries).toEqual(bobDAbord.entries)
    expect([...aliceDAbord.tasks].sort((a, b) => a.id.localeCompare(b.id))).toEqual(
      [...bobDAbord.tasks].sort((a, b) => a.id.localeCompare(b.id)),
    )
  })

  it('une arrivee dans le groupe et une validation simultanees coexistent', () => {
    const arrive = applyMutation(baseData(), { type: 'addMembership', membership: membership('a3') })
    const final = applyMutation(arrive, aliceValide)
    expect(final.memberships).toHaveLength(3)
    expect(final.entries).toHaveLength(1)
  })
})
