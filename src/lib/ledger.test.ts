import { describe, expect, it } from 'vitest'
import type { Member, Task, TripState } from '../types'
import { CENTI, balances, beneficiariesOf, completionAmounts, penaltyAmounts, settlements, splitExact } from './ledger'

const sum = (amounts: Record<string, number>) => Object.values(amounts).reduce((a, b) => a + b, 0)

function member(id: string, joinedAt = '2026-08-01T10:00:00.000Z'): Member {
  return { id, name: id, photo: null, hasLicense: false, role: 'member', joinedAt }
}

function stateWith(entries: TripState['entries'], members: Member[]): TripState {
  return {
    trip: {
      id: 'trip1',
      name: 'Test',
      startDate: '2026-08-22',
      endDate: '2026-08-29',
      ownerId: members[0].id,
      penalty: 30,
      closingOpen: false,
    },
    members,
    tasks: [],
    entries,
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
  const members = [member('m1'), member('m2')]
  const base: Omit<Task, 'beneficiaryIds'> = {
    id: 't1',
    title: 'Vaisselle',
    emoji: '🍽️',
    points: 10,
    date: '2026-08-22',
    time: '21:00',
    needsLicense: false,
    assignedTo: null,
    status: 'todo',
    createdBy: 'm1',
    recurring: false,
    isClosing: false,
  }

  it('null signifie tout le monde', () => {
    expect(beneficiariesOf({ ...base, beneficiaryIds: null }, members)).toEqual(['m1', 'm2'])
  })

  it('ignore les beneficiaires qui ne sont plus dans le sejour', () => {
    expect(beneficiariesOf({ ...base, beneficiaryIds: ['m2', 'parti'] }, members)).toEqual(['m2'])
  })
})

describe('completionAmounts', () => {
  it('la somme des montants est toujours nulle', () => {
    expect(sum(completionAmounts(10, ['m1'], ['m1', 'm2', 'm3']))).toBe(0)
  })

  it('celui qui fait la tache et en profite reste crediteur net', () => {
    const amounts = completionAmounts(30, ['m1'], ['m1', 'm2', 'm3'])
    expect(amounts.m1).toBe(30 * CENTI - 10 * CENTI)
    expect(amounts.m2).toBe(-10 * CENTI)
    expect(sum(amounts)).toBe(0)
  })

  it('partage le credit entre plusieurs personnes qui font la tache', () => {
    const amounts = completionAmounts(10, ['m1', 'm2'], ['m3', 'm4'])
    expect(amounts.m1).toBe(500)
    expect(amounts.m2).toBe(500)
    expect(sum(amounts)).toBe(0)
  })

  it('ne perd pas un centieme sur une division qui ne tombe pas juste', () => {
    expect(sum(completionAmounts(10, ['m1', 'm2', 'm3'], ['m4', 'm5', 'm6', 'm7']))).toBe(0)
  })

  it('quand celui qui fait est le seul beneficiaire, son solde ne bouge pas', () => {
    expect(completionAmounts(15, ['m1'], ['m1'])).toEqual({ m1: 0 })
  })
})

describe('penaltyAmounts', () => {
  it('la somme des montants est toujours nulle', () => {
    expect(sum(penaltyAmounts(30, 'm1', ['m1', 'm2', 'm3']))).toBe(0)
  })

  it('le fautif perd la totalite du malus et les autres se le partagent', () => {
    const amounts = penaltyAmounts(30, 'm1', ['m1', 'm2', 'm3'])
    expect(amounts.m1).toBe(-3000)
    expect(amounts.m2).toBe(1500)
    expect(amounts.m3).toBe(1500)
  })

  it('sans autre beneficiaire, personne n est penalise', () => {
    expect(penaltyAmounts(30, 'm1', ['m1'])).toEqual({ m1: 0 })
  })
})

describe('balances', () => {
  const members = [member('m1'), member('m2'), member('m3')]

  it('classe du plus crediteur au plus debiteur', () => {
    const rows = balances(
      stateWith(
        [
          {
            id: 'e1',
            taskId: 't1',
            kind: 'completion',
            doerIds: ['m1'],
            beneficiaryIds: ['m1', 'm2', 'm3'],
            amounts: completionAmounts(30, ['m1'], ['m1', 'm2', 'm3']),
            validatedBy: 'm1',
            at: '2026-08-22T09:00:00.000Z',
          },
        ],
        members,
      ),
    )
    expect(rows.map((r) => r.member.id)).toEqual(['m1', 'm2', 'm3'])
    expect(rows[0].rank).toBe(1)
    expect(rows[0].tasksDone).toBe(1)
    expect(rows.reduce((acc, r) => acc + r.centi, 0)).toBe(0)
  })

  it('a egalite, celui qui n a rien fait depuis le plus longtemps passe derriere', () => {
    const rows = balances(
      stateWith(
        [
          {
            id: 'e1',
            taskId: 't1',
            kind: 'completion',
            doerIds: ['m1'],
            beneficiaryIds: ['m1'],
            amounts: completionAmounts(10, ['m1'], ['m1']),
            validatedBy: 'm1',
            at: '2026-08-22T09:00:00.000Z',
          },
          {
            id: 'e2',
            taskId: 't2',
            kind: 'completion',
            doerIds: ['m2'],
            beneficiaryIds: ['m2'],
            amounts: completionAmounts(10, ['m2'], ['m2']),
            validatedBy: 'm2',
            at: '2026-08-24T09:00:00.000Z',
          },
        ],
        members,
      ),
    )
    expect(rows.map((r) => r.member.id)).toEqual(['m2', 'm1', 'm3'])
  })

  it('sans aucune ligne de compte, tout le monde est a zero', () => {
    const rows = balances(stateWith([], members))
    expect(rows.every((r) => r.centi === 0 && r.tasksDone === 0)).toBe(true)
  })
})

describe('settlements', () => {
  const members = [member('m1'), member('m2'), member('m3'), member('m4')]

  it('ramene tous les soldes a zero', () => {
    const rows = balances(
      stateWith(
        [
          {
            id: 'e1',
            taskId: 't1',
            kind: 'completion',
            doerIds: ['m1'],
            beneficiaryIds: ['m1', 'm2', 'm3', 'm4'],
            amounts: completionAmounts(40, ['m1'], ['m1', 'm2', 'm3', 'm4']),
            validatedBy: 'm1',
            at: '2026-08-22T09:00:00.000Z',
          },
        ],
        members,
      ),
    )
    const transfers = settlements(rows)
    expect(transfers.length).toBeGreaterThan(0)

    const after = new Map(rows.map((r) => [r.member.id, r.centi]))
    for (const tr of transfers) {
      after.set(tr.fromId, (after.get(tr.fromId) ?? 0) + tr.centi)
      after.set(tr.toId, (after.get(tr.toId) ?? 0) - tr.centi)
    }
    expect([...after.values()].every((v) => v === 0)).toBe(true)
  })

  it('n affiche pas les miettes en dessous d un point', () => {
    const rows = balances(
      stateWith(
        [
          {
            id: 'e1',
            taskId: 't1',
            kind: 'completion',
            doerIds: ['m1'],
            beneficiaryIds: ['m1', 'm2'],
            amounts: { m1: 50, m2: -50 },
            validatedBy: 'm1',
            at: '2026-08-22T09:00:00.000Z',
          },
        ],
        members,
      ),
    )
    expect(settlements(rows)).toEqual([])
  })

  it('ne propose aucun echange quand tout le monde est a zero', () => {
    expect(settlements(balances(stateWith([], members)))).toEqual([])
  })
})
