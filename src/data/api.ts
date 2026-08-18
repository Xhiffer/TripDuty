import type { Account, Entry, Group, GroupKind, Person, Role, Task } from '../types'

/**
 * Le seul endroit de l'application qui parle au serveur.
 * Les ecrans ne connaissent que le contexte de state.tsx, jamais ces adresses.
 */
const BASE = '/api'

export class ApiError extends Error {
  constructor(public code: string) {
    super(code)
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${BASE}${path}`, {
    credentials: 'same-origin',
    headers: options.body ? { 'Content-Type': 'application/json' } : undefined,
    ...options,
  })
  const text = await response.text()
  const payload = text ? JSON.parse(text) : {}
  if (!response.ok) throw new ApiError(payload.error ?? 'serverError')
  return payload as T
}

export interface GroupSummary extends Group {
  memberCount: number
}

export interface RemoteGroupView {
  group: Group
  members: Person[]
  tasks: Task[]
  entries: Entry[]
  version: number
}

export const api = {
  signUp: (email: string, password: string) =>
    request<{ account: Account }>('/auth/signup', { method: 'POST', body: JSON.stringify({ email, password }) }),

  signIn: (email: string, password: string) =>
    request<{ account: Account }>('/auth/signin', { method: 'POST', body: JSON.stringify({ email, password }) }),

  signOut: () => request<{ ok: true }>('/auth/signout', { method: 'POST' }),

  me: () => request<{ account: Account; groups: GroupSummary[] }>('/me'),

  updateProfile: (patch: Partial<Account>) =>
    request<{ account: Account }>('/me', { method: 'PATCH', body: JSON.stringify(patch) }),

  createGroup: (input: {
    kind: GroupKind
    name: string
    emoji: string
    color: string
    startDate: string
    endDate: string
    hasLicense: boolean
  }) => request<{ group: Group }>('/groups', { method: 'POST', body: JSON.stringify(input) }),

  joinByCode: (code: string) =>
    request<{ group: Group }>('/groups/join', { method: 'POST', body: JSON.stringify({ code }) }),

  group: (groupId: string) => request<RemoteGroupView>(`/groups/${groupId}`),

  version: (groupId: string) => request<{ version: number }>(`/groups/${groupId}/version`),

  updateGroup: (groupId: string, patch: Partial<Group>) =>
    request<{ ok: true }>(`/groups/${groupId}`, { method: 'PATCH', body: JSON.stringify(patch) }),

  invite: (groupId: string, email: string) =>
    request<{ ok: true }>(`/groups/${groupId}/invite`, { method: 'POST', body: JSON.stringify({ email }) }),

  leave: (groupId: string) => request<{ ok: true }>(`/groups/${groupId}/me`, { method: 'DELETE' }),

  setMember: (groupId: string, accountId: string, patch: { role?: Role; hasLicense?: boolean }) =>
    request<{ ok: true }>(`/groups/${groupId}/members/${accountId}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    }),

  addTask: (groupId: string, task: Omit<Task, 'id' | 'status' | 'groupId'>) =>
    request<{ task: Task }>(`/groups/${groupId}/tasks`, { method: 'POST', body: JSON.stringify(task) }),

  patchTask: (groupId: string, taskId: string, patch: { assignedTo?: string | null; recurring?: boolean }) =>
    request<{ ok: true }>(`/groups/${groupId}/tasks/${taskId}`, { method: 'PATCH', body: JSON.stringify(patch) }),

  deleteTask: (groupId: string, taskId: string) =>
    request<{ ok: true }>(`/groups/${groupId}/tasks/${taskId}`, { method: 'DELETE' }),

  validateTask: (groupId: string, taskId: string, doerIds: string[], beneficiaryIds: string[]) =>
    request<{ ok: true }>(`/groups/${groupId}/tasks/${taskId}/validate`, {
      method: 'POST',
      body: JSON.stringify({ doerIds, beneficiaryIds }),
    }),

  missTask: (groupId: string, taskId: string) =>
    request<{ ok: true }>(`/groups/${groupId}/tasks/${taskId}/miss`, { method: 'POST' }),

  reopenTask: (groupId: string, taskId: string) =>
    request<{ ok: true }>(`/groups/${groupId}/tasks/${taskId}/reopen`, { method: 'POST' }),
}
