export type Role = 'owner' | 'chef' | 'member'

export interface Member {
  id: string
  name: string
  photo: string | null // dataURL, remplace par une URL Supabase plus tard
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
  penalty: number // points retires par tache non effectuee
}

export type TaskStatus = 'todo' | 'done' | 'missed'

export interface Task {
  id: string
  title: string
  titleKey?: string // pour les taches du catalogue, permet la traduction
  emoji: string
  points: number
  date: string // AAAA-MM-JJ
  time: string // HH:MM
  needsLicense: boolean
  assignedTo: string | null // membre a qui la tache est attribuee
  autoAssigned: boolean // attribuee par l'app au dernier du classement
  status: TaskStatus
  createdBy: string
  recurring: boolean
}

export interface Completion {
  id: string
  taskId: string
  participantIds: string[]
  pointsEach: number
  validatedBy: string
  at: string
}

export interface Penalty {
  id: string
  taskId: string
  memberId: string
  points: number // valeur negative
  at: string
}

export interface TripState {
  trip: Trip
  members: Member[]
  tasks: Task[]
  completions: Completion[]
  penalties: Penalty[]
}

export type Lang = 'fr' | 'en'
export type Theme = 'dark' | 'light'
