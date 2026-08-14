export type Role = 'owner' | 'chef' | 'member'

export interface Member {
  id: string
  name: string
  photo: string | null // dataURL, remplace par une URL distante plus tard
  hasLicense: boolean
  role: Role
  joinedAt: string
}

export interface Trip {
  id: string
  name: string
  startDate: string // AAAA-MM-JJ
  endDate: string
  ownerId: string
  penalty: number // points retires quand une tache acceptee n'est pas faite
  closingOpen: boolean // le chef a lance le bilan de fin de sejour
}

export type TaskStatus = 'todo' | 'done' | 'missed'

export interface Task {
  id: string
  title: string
  titleKey?: string // tache du catalogue, permet la traduction
  emoji: string
  points: number
  date: string // AAAA-MM-JJ
  time: string // HH:MM
  needsLicense: boolean
  /** null = la tache profite a tout le monde. Sinon, la liste des beneficiaires. */
  beneficiaryIds: string[] | null
  /** Une personne s'est engagee sur la tache. Seul ce cas peut donner lieu a un malus. */
  assignedTo: string | null
  status: TaskStatus
  createdBy: string
  recurring: boolean
  isClosing: boolean // tache de cloture, jouee au bilan de fin de sejour
}

/**
 * Une ligne de compte. La somme des montants fait toujours zero :
 * ce que gagnent ceux qui font la tache est exactement ce que doivent
 * ceux pour qui elle est faite.
 * Les montants sont en centiemes de point pour que la division tombe juste.
 */
export interface Entry {
  id: string
  taskId: string
  kind: 'completion' | 'penalty'
  doerIds: string[]
  beneficiaryIds: string[]
  amounts: Record<string, number>
  validatedBy: string
  at: string
}

export interface TripState {
  trip: Trip
  members: Member[]
  tasks: Task[]
  entries: Entry[]
}

export type Lang = 'fr' | 'en'
export type Theme = 'dark' | 'light'
