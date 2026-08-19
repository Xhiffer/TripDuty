export type Role = 'host' | 'chef' | 'member'
export type GroupKind = 'vacances' | 'couple' | 'potes'

/** Un compte, independant des groupes. Une personne, un compte. */
export interface Account {
  id: string
  email: string
  passwordHash: string
  firstName: string
  lastName: string
  /** Ce que les autres voient dans un groupe. Vide, on affiche le prenom. */
  nickname: string
  birthDate: string // AAAA-MM-JJ
  photo: string | null // dataURL, remplace par une URL distante plus tard
  color: string // couleur de la pastille quand il n'y a pas de photo
  createdAt: string
}

export interface Group {
  id: string
  kind: GroupKind
  name: string
  emoji: string
  /** Une photo remplace l'icone quand elle est renseignee. */
  photo: string | null
  color: string
  startDate: string // AAAA-MM-JJ
  endDate: string
  hostId: string
  inviteCode: string
  penalty: number // points retires quand une tache acceptee n'est pas faite
  closingOpen: boolean // l'hote a lance le bilan de fin
  createdAt: string
}

export interface Membership {
  id: string
  groupId: string
  accountId: string
  role: Role
  hasLicense: boolean
  joinedAt: string
}

export type TaskStatus = 'todo' | 'done' | 'missed'

export interface Task {
  id: string
  groupId: string
  title: string
  titleKey?: string // tache du catalogue, permet la traduction
  emoji: string
  points: number
  date: string // AAAA-MM-JJ
  time: string // HH:MM
  needsLicense: boolean
  /** null = la tache profite a tout le monde. Sinon, la liste des beneficiaires. */
  beneficiaryIds: string[] | null
  /** Quelqu'un s'est engage. Seul ce cas peut donner lieu a un malus. */
  assignedTo: string | null
  status: TaskStatus
  createdBy: string
  recurring: boolean
  isClosing: boolean
}

/**
 * Une ligne de compte. La somme des montants fait toujours zero :
 * ce que gagnent ceux qui font la tache est exactement ce que doivent
 * ceux pour qui elle est faite. Montants en centiemes de point.
 */
export interface Entry {
  id: string
  groupId: string
  taskId: string
  kind: 'completion' | 'penalty'
  doerIds: string[]
  beneficiaryIds: string[]
  amounts: Record<string, number>
  validatedBy: string
  at: string
}

/**
 * Une depense du groupe. Un seul payeur, un partage a parts egales entre
 * les participants coches. Montant en centimes d'euro.
 */
export interface Expense {
  id: string
  groupId: string
  title: string
  emoji: string
  amountCents: number
  payerId: string
  participantIds: string[]
  date: string // AAAA-MM-JJ
  receipt: string | null
  createdBy: string
  createdAt: string
}

export interface AppData {
  accounts: Account[]
  groups: Group[]
  memberships: Membership[]
  tasks: Task[]
  entries: Entry[]
  expenses: Expense[]
}

/** Vue d'une personne dans le groupe courant, telle que l'affichent les ecrans. */
export interface Person {
  id: string // identifiant du compte
  name: string
  photo: string | null
  color: string
  hasLicense: boolean
  role: Role
  joinedAt: string
}

/** Le groupe courant, mis a plat pour les ecrans. */
export interface GroupView {
  group: Group
  members: Person[]
  tasks: Task[]
  entries: Entry[]
  expenses: Expense[]
}

export type Lang = 'fr' | 'en'
export type Theme = 'dark' | 'light'
