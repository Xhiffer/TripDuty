import type { Member, TripState } from '../types'

export interface Standing {
  member: Member
  score: number
  tasksDone: number
  lastEarnedAt: string | null
  rank: number
}

/**
 * Score cumule sur tout le sejour :
 * points gagnes (partages entre les participants d'une tache) moins les malus.
 */
export function standings(state: TripState): Standing[] {
  const rows = state.members.map((member) => {
    let score = 0
    let tasksDone = 0
    let lastEarnedAt: string | null = null

    for (const c of state.completions) {
      if (!c.participantIds.includes(member.id)) continue
      score += c.pointsEach
      tasksDone += 1
      if (!lastEarnedAt || c.at > lastEarnedAt) lastEarnedAt = c.at
    }
    for (const p of state.penalties) {
      if (p.memberId !== member.id) continue
      score += p.points
    }
    return { member, score, tasksDone, lastEarnedAt, rank: 0 }
  })

  rows.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    // A egalite, celui qui n'a rien gagne depuis le plus longtemps passe derriere.
    const aTime = a.lastEarnedAt ?? ''
    const bTime = b.lastEarnedAt ?? ''
    if (aTime !== bTime) return bTime.localeCompare(aTime)
    return a.member.joinedAt.localeCompare(b.member.joinedAt)
  })

  rows.forEach((row, i) => {
    row.rank = i + 1
  })
  return rows
}

export function lastPlace(state: TripState): Standing | null {
  const rows = standings(state)
  if (rows.length === 0) return null
  return rows[rows.length - 1]
}

export function pointsEachFor(points: number, participants: number): number {
  if (participants <= 0) return 0
  return Math.floor(points / participants)
}
