import { describe, expect, it } from 'vitest'
import type { Entry, Group, GroupView, Person, Task } from '../types'
import { CENTI, balances, beneficiariesOf, completionAmounts, penaltyAmounts, splitExact } from './ledger'

const sum = (amounts: Record<string, number>) => Object.values(amounts).reduce((a, b) => a + b, 0)

function person(id: string, role: Person['role'] = 'member'): Person {
  return {
    id,
    name: id,
    photo: null,
    color: '#3d8bff',
    hasLicense: false,
    role,
    joinedAt: '2026-08-01T10:00:00.000Z',
  }
}

const group: Group = {
  id: 'g1',
  kind: 'vacances',
  name: 'Gorges du Verdon',
  emoji: '⛰️',
  photo: null,
  color: '#ff6a3d',
  startDate: '2026-08-22',
  endDate: '2026-08-29',
  hostId: 'p1',
  inviteCode: 'ABC234',
  penalty: 30,
  closingOpen: false,
  createdAt: '2026-08-01T10:00:00.000Z',
}

function viewWith(entries: Entry[], members: Person[]): GroupView {
  return { group, members, tasks: [], entries, expenses: [] }
}

function entry(patch: Partial<Entry> & Pick<Entry, 'id' | 'taskId' | 'amounts'>): Entry {
  return {
    groupId: 'g1',
    kind: 'completion',
    doerIds: [],
    beneficiaryIds: [],
    validatedBy: 'p1',
    at: '2026-08-22T09:00:00.000Z',
    ...patch,
  }
}

describe('splitExact', () => {
  it('divise sans reste quand la division tombe juste', () => {
    expect(splitExact(900, 3)).toEqual([300, 300, 300])
  })

  it('donne le reste aux premieres parts', () => {
    expect(splitExact(10, 3)).toEqual([4, 3, 3])
  })

  it('conserve toujours le total, quel que soit le nombre de parts', () => {
    for (let n = 1; n <= 12; n += 1) {
      expect(splitExact(1000, n).reduce((a, b) => a + b, 0)).toBe(1000)
    }
  })

  it('retourne une liste vide pour zero part', () => {
    expect(splitExact(500, 0)).toEqual([])
  })
})

describe('beneficiariesOf', () => {
  const members = [person('p1'), person('p2')]
  const base: Omit<Task, 'beneficiaryIds'> = {
    id: 't1',
    groupId: 'g1',
    title: 'Vaisselle',
    emoji: '🍽️',
    points: 10,
    date: '2026-08-22',
    time: '21:00',
    needsLicense: false,
    assignedTo: null,
    status: 'todo',
    createdBy: 'p1',
    recurring: false,
    isClosing: false,
  }

  it('null signifie tout le monde', () => {
    expect(beneficiariesOf({ ...base, beneficiaryIds: null }, members)).toEqual(['p1', 'p2'])
  })

  it('ignore les beneficiaires qui ne sont plus dans le groupe', () => {
    expect(beneficiariesOf({ ...base, beneficiaryIds: ['p2', 'parti'] }, members)).toEqual(['p2'])
  })
})

describe('completionAmounts', () => {
  it('seuls ceux qui font la tache gagnent des points', () => {
    const amounts = completionAmounts(10, ['p1'], ['p1', 'p2', 'p3'])
    expect(Object.keys(amounts)).toEqual(['p1'])
    expect(amounts.p1).toBeGreaterThan(0)
  })

  it('personne n est jamais debite', () => {
    const amounts = completionAmounts(30, ['p1'], ['p1', 'p2', 'p3'])
    expect(Object.values(amounts).every((a) => a >= 0)).toBe(true)
  })

  it('partage le credit entre plusieurs personnes qui font la tache', () => {
    const amounts = completionAmounts(10, ['p1', 'p2'], ['p3', 'p4'])
    expect(amounts.p1).toBe(500)
    expect(amounts.p2).toBe(500)
    expect(sum(amounts)).toBe(10 * CENTI)
  })

  it('ne perd pas un centieme sur une division qui ne tombe pas juste', () => {
    expect(sum(completionAmounts(10, ['p1', 'p2', 'p3'], ['p4', 'p5', 'p6', 'p7']))).toBe(10 * CENTI)
  })

  it('se faire son sandwich tout seul ne rapporte rien', () => {
    expect(completionAmounts(15, ['p1'], ['p1'])).toEqual({ p1: 0 })
  })

  it('se cuisiner pour soi seul dans un groupe de dix ne rapporte toujours rien', () => {
    expect(completionAmounts(35, ['p1'], ['p1'], 10)).toEqual({ p1: 0 })
  })

  it('servir tout le groupe sans en profiter vaut le bareme entier', () => {
    const amounts = completionAmounts(30, ['p1'], ['p2', 'p3', 'p4', 'p5', 'p6'], 5)
    expect(amounts.p1).toBe(30 * CENTI)
  })

  it('cuisiner en faisant partie des convives rapporte presque tout', () => {
    const amounts = completionAmounts(30, ['p1'], ['p1', 'p2', 'p3', 'p4', 'p5'], 5)
    expect(amounts.p1).toBeLessThan(30 * CENTI)
    expect(amounts.p1).toBeGreaterThan(25 * CENTI)
  })

  it('servir la moitie du groupe rapporte plus que la moitie', () => {
    const cinq = completionAmounts(30, ['p1'], ['p1', 'p2', 'p3', 'p4', 'p5'], 10)
    const dix = completionAmounts(30, ['p1'], ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8', 'p9', 'p10'], 10)
    // La division stricte punissait trop celui qui cuisine pour la moitie du
    // groupe : la courbe lui laisse plus que la moitie de la valeur.
    expect(cinq.p1).toBeGreaterThan(dix.p1 / 2)
    expect(cinq.p1).toBeLessThan(dix.p1)
  })

  it('sans taille de groupe, la tache est reputee profiter a tout le monde', () => {
    expect(completionAmounts(30, ['p1'], ['p1', 'p2', 'p3'])).toEqual(
      completionAmounts(30, ['p1'], ['p1', 'p2', 'p3'], 3),
    )
  })
})

describe('penaltyAmounts', () => {
  it('le fautif perd le malus, et personne ne le recupere', () => {
    expect(penaltyAmounts(30, 'p1')).toEqual({ p1: -3000 })
  })
})

describe('balances', () => {
  const members = [person('p1', 'host'), person('p2'), person('p3')]

  it('classe du plus fourni au moins fourni', () => {
    const rows = balances(
      viewWith(
        [
          entry({
            id: 'e1',
            taskId: 't1',
            doerIds: ['p1'],
            beneficiaryIds: ['p1', 'p2', 'p3'],
            amounts: completionAmounts(30, ['p1'], ['p1', 'p2', 'p3']),
          }),
        ],
        members,
      ),
    )
    expect(rows.map((r) => r.member.id)).toEqual(['p1', 'p2', 'p3'])
    expect(rows[0].rank).toBe(1)
    expect(rows[0].tasksDone).toBe(1)
    expect(rows[1].centi).toBe(0)
    expect(rows[2].centi).toBe(0)
  })

  it('un malus ne fait jamais descendre sous zero', () => {
    const rows = balances(
      viewWith(
        [entry({ id: 'e1', taskId: 't1', kind: 'penalty', doerIds: [], amounts: penaltyAmounts(30, 'p2') })],
        members,
      ),
    )
    expect(rows.every((r) => r.centi >= 0)).toBe(true)
    expect(rows.find((r) => r.member.id === 'p2')?.centi).toBe(0)
  })

  it('a egalite, celui qui n a rien fait depuis le plus longtemps passe derriere', () => {
    const rows = balances(
      viewWith(
        [
          entry({
            id: 'e1',
            taskId: 't1',
            doerIds: ['p1'],
            beneficiaryIds: ['p1'],
            amounts: completionAmounts(10, ['p1'], ['p1']),
            at: '2026-08-22T09:00:00.000Z',
          }),
          entry({
            id: 'e2',
            taskId: 't2',
            doerIds: ['p2'],
            beneficiaryIds: ['p2'],
            amounts: completionAmounts(10, ['p2'], ['p2']),
            validatedBy: 'p2',
            at: '2026-08-24T09:00:00.000Z',
          }),
        ],
        members,
      ),
    )
    expect(rows.map((r) => r.member.id)).toEqual(['p2', 'p1', 'p3'])
  })

  it('sans aucune ligne de compte, tout le monde est a zero', () => {
    const rows = balances(viewWith([], members))
    expect(rows.every((r) => r.centi === 0 && r.tasksDone === 0)).toBe(true)
  })
})
