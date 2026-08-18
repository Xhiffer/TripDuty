import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Entry, Member, Task, Trip, TripState } from '../types'
import type { Store } from './store'

/**
 * Le sejour partage, sur Supabase.
 *
 * Chaque mutation devient une ecriture ciblee : une ligne touchee, jamais le
 * sejour entier. C'est ce qui permet a deux telephones d'agir en meme temps
 * sans que l'un efface l'autre (voir ./mutations.ts).
 *
 * La cle utilisee ici est la cle publique. Elle est lisible dans le bundle,
 * et c'est voulu : les droits sont appliques par la base, dans
 * supabase/migrations/0002_rls.sql, jamais par le secret de la cle.
 */

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(url && anonKey)

/** Ce telephone n'est encore membre d'aucun sejour. */
export class NoTripError extends Error {
  constructor() {
    super('Aucun sejour pour ce telephone')
    this.name = 'NoTripError'
  }
}

export interface CreateTripArgs {
  name: string
  startDate: string
  endDate: string
  ownerName: string
  ownerPhoto?: string | null
  ownerHasLicense?: boolean
  penalty?: number
}

export interface JoinTripArgs {
  code: string
  name: string
  photo?: string | null
  hasLicense?: boolean
}

export interface SharedStore extends Store {
  createTrip(args: CreateTripArgs): Promise<string>
  joinTrip(args: JoinTripArgs): Promise<void>
  joinCode(): string | null
}

// ---------------------------------------------------------------------------
// Traduction entre la base (snake_case) et l'application (camelCase)
// ---------------------------------------------------------------------------

interface TripRow {
  id: string
  name: string
  start_date: string
  end_date: string
  penalty: number
  closing_open: boolean
  join_code: string
}

interface MemberRow {
  id: string
  name: string
  photo_url: string | null
  has_license: boolean
  role: Member['role']
  joined_at: string
}

interface TaskRow {
  id: string
  title: string
  title_key: string | null
  emoji: string
  points: number
  day: string
  time_of_day: string
  needs_license: boolean
  beneficiary_ids: string[] | null
  assigned_to: string | null
  status: Task['status']
  created_by: string
  recurring: boolean
  is_closing: boolean
}

interface EntryRow {
  id: string
  task_id: string
  kind: Entry['kind']
  doer_ids: string[]
  beneficiary_ids: string[]
  amounts: Record<string, number>
  validated_by: string
  at: string
}

function toMember(row: MemberRow): Member {
  return {
    id: row.id,
    name: row.name,
    photo: row.photo_url,
    hasLicense: row.has_license,
    role: row.role,
    joinedAt: row.joined_at,
  }
}

function toTask(row: TaskRow): Task {
  return {
    id: row.id,
    title: row.title,
    titleKey: row.title_key ?? undefined,
    emoji: row.emoji,
    points: row.points,
    date: row.day,
    // Postgres rend une heure complete ("21:00:00"), l'app affiche "21:00".
    time: row.time_of_day.slice(0, 5),
    needsLicense: row.needs_license,
    beneficiaryIds: row.beneficiary_ids,
    assignedTo: row.assigned_to,
    status: row.status,
    createdBy: row.created_by,
    recurring: row.recurring,
    isClosing: row.is_closing,
  }
}

function toEntry(row: EntryRow): Entry {
  return {
    id: row.id,
    taskId: row.task_id,
    kind: row.kind,
    doerIds: row.doer_ids,
    beneficiaryIds: row.beneficiary_ids,
    amounts: row.amounts,
    validatedBy: row.validated_by,
    at: row.at,
  }
}

function toTrip(row: TripRow, members: Member[]): Trip {
  return {
    id: row.id,
    name: row.name,
    startDate: row.start_date,
    endDate: row.end_date,
    // La table ne porte pas de proprietaire : c'est le role qui le dit, pour
    // qu'il n'existe qu'une seule verite sur ce point.
    ownerId: members.find((m) => m.role === 'owner')?.id ?? members[0]?.id ?? '',
    penalty: row.penalty,
    closingOpen: row.closing_open,
  }
}

function taskToRow(tripId: string, task: Task) {
  return {
    id: task.id,
    trip_id: tripId,
    title: task.title,
    title_key: task.titleKey ?? null,
    emoji: task.emoji,
    points: task.points,
    day: task.date,
    time_of_day: task.time,
    needs_license: task.needsLicense,
    beneficiary_ids: task.beneficiaryIds,
    assigned_to: task.assignedTo,
    status: task.status,
    created_by: task.createdBy,
    recurring: task.recurring,
    is_closing: task.isClosing,
  }
}

function entryToRow(tripId: string, entry: Entry) {
  return {
    id: entry.id,
    trip_id: tripId,
    task_id: entry.taskId,
    kind: entry.kind,
    doer_ids: entry.doerIds,
    beneficiary_ids: entry.beneficiaryIds,
    amounts: entry.amounts,
    validated_by: entry.validatedBy,
    at: entry.at,
  }
}

// ---------------------------------------------------------------------------
// Magasin
// ---------------------------------------------------------------------------

export function createSupabaseStore(): SharedStore {
  const client: SupabaseClient = createClient(url, anonKey, {
    auth: { persistSession: true, autoRefreshToken: true },
  })

  // Le sejour ouvert sur ce telephone, retenu entre deux appels pour que
  // `apply` sache ou ecrire sans le redemander a chaque geste.
  let tripId: string | null = null
  let code: string | null = null

  /**
   * Chaque telephone recoit une identite des le premier chargement, sans
   * creation de compte. C'est elle que les regles RLS interrogent : sans
   * identite, la base ne montre rien.
   */
  async function ensureSession() {
    const { data } = await client.auth.getSession()
    if (data.session) return
    const { error } = await client.auth.signInAnonymously()
    if (error) throw new Error(`Connexion impossible : ${error.message}`)
  }

  async function fetchState(id: string): Promise<TripState> {
    // Les quatre lectures sont independantes : les enchainer ferait attendre
    // le telephone quatre fois pour rien.
    const [trip, members, tasks, entries] = await Promise.all([
      client.from('trips').select('*').eq('id', id).single(),
      client.from('members').select('*').eq('trip_id', id).order('joined_at'),
      client.from('tasks').select('*').eq('trip_id', id).order('day').order('time_of_day'),
      client.from('entries').select('*').eq('trip_id', id),
    ])

    const failure = trip.error ?? members.error ?? tasks.error ?? entries.error
    if (failure) throw new Error(`Lecture du sejour impossible : ${failure.message}`)

    const tripRow = trip.data as TripRow
    const memberList = (members.data as MemberRow[]).map(toMember)
    code = tripRow.join_code

    return {
      trip: toTrip(tripRow, memberList),
      members: memberList,
      tasks: (tasks.data as TaskRow[]).map(toTask),
      entries: (entries.data as EntryRow[]).map(toEntry),
    }
  }

  async function currentTripId(): Promise<string | null> {
    const { data: auth } = await client.auth.getUser()
    if (!auth.user) return null
    const { data } = await client
      .from('members')
      .select('trip_id')
      .eq('auth_user_id', auth.user.id)
      .order('joined_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    return (data as { trip_id: string } | null)?.trip_id ?? null
  }

  function reject(error: { message: string } | null) {
    if (error) throw new Error(`Ecriture refusee : ${error.message}`)
  }

  return {
    joinCode: () => code,

    async load() {
      await ensureSession()
      tripId = await currentTripId()
      // Ce telephone n'appartient encore a aucun sejour : l'accueil doit
      // proposer d'en creer un, ou d'en rejoindre un avec le code.
      if (!tripId) throw new NoTripError()
      return fetchState(tripId)
    },

    async createTrip(args) {
      await ensureSession()
      const { data, error } = await client.rpc('create_trip', {
        trip_name: args.name,
        start_date: args.startDate,
        end_date: args.endDate,
        owner_name: args.ownerName,
        owner_photo: args.ownerPhoto ?? null,
        owner_licence: args.ownerHasLicense ?? false,
        penalty: args.penalty ?? 30,
      })
      if (error) throw new Error(`Creation du sejour impossible : ${error.message}`)
      const row = data as TripRow
      tripId = row.id
      code = row.join_code
      return row.join_code
    },

    async joinTrip(args) {
      await ensureSession()
      const { error } = await client.rpc('join_trip', {
        code: args.code.trim().toLowerCase(),
        member_name: args.name,
        member_photo: args.photo ?? null,
        has_licence: args.hasLicense ?? false,
      })
      if (error) throw new Error(`Impossible de rejoindre : ${error.message}`)
      tripId = await currentTripId()
    },

    async apply(mutation) {
      const id = tripId
      if (!id) throw new Error('Aucun sejour ouvert')

      switch (mutation.type) {
        case 'addMember':
          // On n'entre pas dans un sejour en inserant une ligne : il faut le
          // code de partage, donc joinTrip(). La base refuse d'ailleurs tout
          // INSERT direct sur `members`.
          throw new Error('Rejoindre un sejour passe par joinTrip()')

        case 'setRole':
          reject((await client.from('members').update({ role: mutation.role }).eq('id', mutation.memberId)).error)
          return

        case 'addTask':
          reject((await client.from('tasks').insert(taskToRow(id, mutation.task))).error)
          return

        case 'assignTask':
          reject(
            (await client.from('tasks').update({ assigned_to: mutation.memberId }).eq('id', mutation.taskId)).error,
          )
          return

        case 'setRecurring':
          reject((await client.from('tasks').update({ recurring: mutation.recurring }).eq('id', mutation.taskId)).error)
          return

        case 'settleTask':
          reject((await client.from('tasks').update({ status: mutation.status }).eq('id', mutation.taskId)).error)
          // `unique (task_id)` fait que revalider remplace, au lieu d'empiler.
          reject((await client.from('entries').upsert(entryToRow(id, mutation.entry), { onConflict: 'task_id' })).error)
          return

        case 'reopenTask':
          reject((await client.from('tasks').update({ status: 'todo' }).eq('id', mutation.taskId)).error)
          reject((await client.from('entries').delete().eq('task_id', mutation.taskId)).error)
          return

        case 'deleteTask':
          // `on delete cascade` emporte la ligne de compte avec la tache.
          reject((await client.from('tasks').delete().eq('id', mutation.taskId)).error)
          return

        case 'updateTrip': {
          const patch: Record<string, unknown> = {}
          if (mutation.patch.name !== undefined) patch.name = mutation.patch.name
          if (mutation.patch.startDate !== undefined) patch.start_date = mutation.patch.startDate
          if (mutation.patch.endDate !== undefined) patch.end_date = mutation.patch.endDate
          if (mutation.patch.penalty !== undefined) patch.penalty = mutation.patch.penalty
          if (mutation.patch.closingOpen !== undefined) patch.closing_open = mutation.patch.closingOpen
          if (Object.keys(patch).length === 0) return
          reject((await client.from('trips').update(patch).eq('id', id)).error)
          return
        }
      }
    },

    subscribe(onChange) {
      const channel = client
        .channel('sejour')
        // On relit le sejour plutot que d'appliquer le delta recu : a cette
        // taille la relecture est bon marche, et elle ne peut pas diverger de
        // la base. Les regles RLS valent aussi ici : on ne recoit que les
        // changements des sejours dont on est membre.
        .on('postgres_changes', { event: '*', schema: 'public' }, () => {
          if (!tripId) return
          void fetchState(tripId)
            .then(onChange)
            .catch(() => {
              // Une relecture ratee n'efface pas ce qui est affiche.
            })
        })
        .subscribe()

      return () => {
        void client.removeChannel(channel)
      }
    },
  }
}
