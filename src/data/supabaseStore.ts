import type { Account, AppData, Entry, Expense, Group, Membership, Task } from '../types'
import type { Mutation } from './mutations'
import { supabase } from './supabaseClient'

/**
 * La meme application, mais partagee.
 *
 * Deux traductions se font ici, et une seule est evidente :
 *
 *   * les noms : `has_license` cote base, `hasLicense` cote ecrans. Mecanique.
 *   * les droits : ce que `load()` rapporte n'est pas « tout », c'est « tout ce
 *     que la RLS m'autorise a voir ». Aucun filtre n'est ecrit ici, et c'est
 *     voulu : un filtre cote client se contourne, une politique cote base non.
 *
 * Ce que ce magasin ne fait pas : creer, rejoindre et quitter un groupe. Ces
 * trois gestes ecrivent dans une table dont on n'est pas encore membre, donc
 * hors de portee de la RLS ; ils passent par les fonctions SECURITY DEFINER de
 * supabase/migrations/0003_rpc.sql, appelees depuis state.tsx. Une mutation ne
 * transporte de toute facon ni le code d'invitation ni le successeur designe.
 */

const EMPTY: AppData = { accounts: [], groups: [], memberships: [], tasks: [], entries: [], expenses: [] }

// --- traduction base -> ecrans ---------------------------------------------

type Row = Record<string, unknown>

const str = (v: unknown) => (typeof v === 'string' ? v : '')
const num = (v: unknown) => (typeof v === 'number' ? v : Number(v) || 0)
const bool = (v: unknown) => v === true
const ids = (v: unknown) => (Array.isArray(v) ? v.map(String) : [])

function toAccount(row: Row, myId: string | null, myEmail: string): Account {
  const id = str(row.id)
  return {
    id,
    // `profiles` ne porte pas d'adresse, et c'est deliberé : pouvoir demander
    // qui possede une adresse permettrait d'en tester pour savoir qui a un
    // compte. On ne connait donc que la sienne, tiree de la session.
    email: id === myId ? myEmail : '',
    // Les mots de passe vivent dans auth.users, hachés par Supabase. Ce champ
    // n'existe que parce que le type local le reclame ; rien ne le lit ici.
    passwordHash: '',
    firstName: str(row.first_name),
    nickname: str(row.nickname),
    lastName: str(row.last_name),
    birthDate: str(row.birth_date),
    photo: row.photo_url ? str(row.photo_url) : null,
    color: str(row.color),
    createdAt: str(row.created_at),
  }
}

function toExpense(row: Row): Expense {
  return {
    id: str(row.id),
    groupId: str(row.group_id),
    title: str(row.title),
    emoji: str(row.emoji),
    amountCents: num(row.amount_cents),
    payerId: str(row.payer_id),
    participantIds: (row.participant_ids as string[] | null) ?? [],
    date: str(row.date),
    receipt: row.receipt_url ? String(row.receipt_url) : null,
    createdBy: str(row.created_by),
    createdAt: str(row.created_at),
  }
}

function toGroup(row: Row): Group {
  return {
    id: str(row.id),
    kind: str(row.kind) as Group['kind'],
    name: str(row.name),
    emoji: str(row.emoji),
    photo: row.photo_url ? String(row.photo_url) : null,
    color: str(row.color),
    startDate: str(row.start_date),
    endDate: row.end_date ? String(row.end_date) : null,
    hostId: str(row.host_id),
    inviteCode: str(row.invite_code),
    penalty: num(row.penalty),
    closingOpen: bool(row.closing_open),
    createdAt: str(row.created_at),
  }
}

function toMembership(row: Row): Membership {
  return {
    id: str(row.id),
    groupId: str(row.group_id),
    accountId: str(row.profile_id),
    role: str(row.role) as Membership['role'],
    hasLicense: bool(row.has_license),
    joinedAt: str(row.joined_at),
  }
}

function toTask(row: Row): Task {
  return {
    id: str(row.id),
    groupId: str(row.group_id),
    title: str(row.title),
    titleKey: row.title_key ? str(row.title_key) : undefined,
    emoji: str(row.emoji),
    points: num(row.points),
    date: str(row.day),
    // `time` en base revient en HH:MM:SS ; les ecrans affichent HH:MM.
    time: str(row.time_of_day).slice(0, 5),
    needsLicense: bool(row.needs_license),
    beneficiaryIds: row.beneficiary_ids === null ? null : ids(row.beneficiary_ids),
    assignedTo: row.assigned_to ? str(row.assigned_to) : null,
    status: str(row.status) as Task['status'],
    createdBy: str(row.created_by),
    recurring: bool(row.recurring),
    isClosing: bool(row.is_closing),
  }
}

function toEntry(row: Row): Entry {
  const raw = (row.amounts ?? {}) as Record<string, unknown>
  const amounts: Record<string, number> = {}
  for (const [id, value] of Object.entries(raw)) amounts[id] = num(value)
  return {
    id: str(row.id),
    groupId: str(row.group_id),
    taskId: str(row.task_id),
    kind: str(row.kind) as Entry['kind'],
    doerIds: ids(row.doer_ids),
    beneficiaryIds: ids(row.beneficiary_ids),
    amounts,
    validatedBy: str(row.validated_by),
    at: str(row.at),
  }
}

// --- traduction ecrans -> base ---------------------------------------------

/** Les colonnes d'une tache. Utilise a l'insertion et pour les taches de cloture. */
export function taskRow(task: Task) {
  return {
    id: task.id,
    group_id: task.groupId,
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

function groupPatch(patch: Partial<Group>): Row {
  const out: Row = {}
  if (patch.name !== undefined) out.name = patch.name
  if (patch.emoji !== undefined) out.emoji = patch.emoji
  if (patch.color !== undefined) out.color = patch.color
  if (patch.startDate !== undefined) out.start_date = patch.startDate
  if (patch.endDate !== undefined) out.end_date = patch.endDate
  if (patch.penalty !== undefined) out.penalty = patch.penalty
  if (patch.closingOpen !== undefined) out.closing_open = patch.closingOpen
  if (patch.photo !== undefined) out.photo_url = patch.photo
  if (patch.hostId !== undefined) out.host_id = patch.hostId
  return out
}

function profilePatch(patch: Partial<Account>): Row {
  const out: Row = {}
  if (patch.firstName !== undefined) out.first_name = patch.firstName
  if (patch.lastName !== undefined) out.last_name = patch.lastName
  if (patch.nickname !== undefined) out.nickname = patch.nickname
  if (patch.birthDate !== undefined) out.birth_date = patch.birthDate || null
  if (patch.photo !== undefined) out.photo_url = patch.photo
  if (patch.color !== undefined) out.color = patch.color
  return out
}

/**
 * Envoie la photo dans le bucket `avatars` et rend son adresse publique.
 *
 * Le chemin commence par l'identifiant du compte : la politique du bucket
 * n'autorise a ecrire que dans son propre dossier.
 */
async function uploadAvatar(accountId: string, dataUrl: string): Promise<string | null> {
  if (!supabase) return null
  try {
    const blob = await (await fetch(dataUrl)).blob()
    const path = `${accountId}/avatar.jpg`
    const { error } = await supabase.storage
      .from('avatars')
      .upload(path, blob, { contentType: 'image/jpeg', upsert: true })
    if (error) throw error
    return supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl
  } catch (error) {
    console.error('[supabase] envoi de la photo impossible', error)
    return null
  }
}

// --- le magasin -------------------------------------------------------------

async function loadAll(retry = true): Promise<AppData> {
  if (!supabase) return EMPTY
  const { data: session } = await supabase.auth.getUser()
  const user = session.user
  // Sans session, la RLS ne laisserait rien passer de toute facon. Autant ne
  // pas payer cinq requetes pour se le faire confirmer.
  if (!user) return EMPTY

  const [profiles, groups, memberships, tasks, entries, expenses] = await Promise.all([
    supabase.from('profiles').select('*'),
    supabase.from('groups').select('*'),
    supabase.from('memberships').select('*'),
    supabase.from('tasks').select('*'),
    supabase.from('entries').select('*'),
    supabase.from('expenses').select('*'),
  ])

  const failed = [profiles, groups, memberships, tasks, entries].find((r) => r.error)
  if (failed?.error) throw new Error(failed.error.message)

  // Juste apres une inscription, la session existe avant que la fiche profil
  // posee par le declencheur ne soit visible. Rendre cet instant tel quel
  // donnerait une application sans compte : l'ecran d'inscription reste
  // affiche, et la personne croit que son inscription a echoue.
  const rows = profiles.data ?? []
  if (!rows.some((r) => (r as Row).id === user.id) && retry) {
    await new Promise((resume) => setTimeout(resume, 400))
    return loadAll(false)
  }

  const email = user.email ?? ''
  return {
    accounts: rows.map((r) => toAccount(r as Row, user.id, email)),
    groups: (groups.data ?? []).map((r) => toGroup(r as Row)),
    memberships: (memberships.data ?? []).map((r) => toMembership(r as Row)),
    tasks: (tasks.data ?? []).map((r) => toTask(r as Row)),
    entries: (entries.data ?? []).map((r) => toEntry(r as Row)),
    expenses: (expenses.data ?? []).map((r) => toExpense(r as Row)),
  }
}

/**
 * Traduit une mutation en ecriture ciblee.
 *
 * Aucune de ces requetes ne verifie de droit : c'est la RLS qui refuse, et
 * elle refuse aussi bien un bug du client qu'un appel forge a la main.
 */
async function applyOne(mutation: Mutation): Promise<void> {
  if (!supabase) return

  switch (mutation.type) {
    // Le compte naît de Supabase Auth, et le declencheur on_auth_user_created
    // pose la fiche correspondante. Rien a ecrire ici.
    case 'addAccount':
      return

    case 'updateProfile': {
      const patch = profilePatch(mutation.patch)
      if (Object.keys(patch).length === 0) return
      // Une photo arrive de l'ecran en base64. La garder telle quelle ferait
      // voyager ~27 ko par personne a chaque lecture de profil ; elle va dans
      // le bucket, et seule son adresse reste en base.
      if (typeof patch.photo_url === 'string' && patch.photo_url.startsWith('data:')) {
        const uploaded = await uploadAvatar(mutation.accountId, patch.photo_url)
        // Echec de l'envoi : on garde le base64 plutot que de perdre la photo.
        if (uploaded) patch.photo_url = uploaded
      }
      await supabase.from('profiles').update(patch).eq('id', mutation.accountId)
      return
    }

    // Les trois portes d'un groupe passent par les RPC, pas par ici.
    case 'addGroup':
    case 'addMembership':
    case 'removeMembership':
    case 'removeGroup':
      return

    case 'updateGroup': {
      const patch = groupPatch(mutation.patch)
      if (Object.keys(patch).length === 0) return
      await supabase.from('groups').update(patch).eq('id', mutation.groupId)
      return
    }

    case 'setRole': {
      await supabase
        .from('memberships')
        .update({ role: mutation.role })
        .eq('group_id', mutation.groupId)
        .eq('profile_id', mutation.accountId)
        // L'hote ne se retrograde pas, meme par accident : la meme regle que
        // dans applyMutation(), rejouee ici parce que la base ne la porte pas.
        .neq('role', 'host')
      return
    }

    case 'setLicense': {
      const { data: session } = await supabase.auth.getUser()
      // Depuis 0005, personne ne modifie directement sa propre ligne : la
      // politique laissait passer un changement de role avec le permis.
      if (session.user?.id === mutation.accountId) {
        await supabase.rpc('set_my_license', {
          target_group: mutation.groupId,
          value: mutation.hasLicense,
        })
        return
      }
      // Le chef, lui, peut regler celui des autres.
      await supabase
        .from('memberships')
        .update({ has_license: mutation.hasLicense })
        .eq('group_id', mutation.groupId)
        .eq('profile_id', mutation.accountId)
      return
    }

    case 'addTask': {
      await supabase.from('tasks').insert(taskRow(mutation.task))
      return
    }

    case 'assignTask': {
      await supabase.from('tasks').update({ assigned_to: mutation.accountId }).eq('id', mutation.taskId)
      return
    }

    case 'setRecurring': {
      await supabase.from('tasks').update({ recurring: mutation.recurring }).eq('id', mutation.taskId)
      return
    }

    case 'settleTask': {
      const e = mutation.entry
      await supabase.from('tasks').update({ status: mutation.status }).eq('id', mutation.taskId)
      // Revalider ne modifie pas la ligne existante, elle la remplace : une
      // ecriture comptable est un fait, pas un etat. `entries` n'a d'ailleurs
      // aucune politique UPDATE, un upsert se ferait refuser au second passage.
      await supabase.from('entries').delete().eq('task_id', mutation.taskId)
      await supabase.from('entries').insert(
        {
          id: e.id,
          group_id: e.groupId,
          task_id: e.taskId,
          kind: e.kind,
          doer_ids: e.doerIds,
          beneficiary_ids: e.beneficiaryIds,
          amounts: e.amounts,
          validated_by: e.validatedBy,
          at: e.at,
        },
      )
      return
    }

    case 'reopenTask': {
      await supabase.from('tasks').update({ status: 'todo' }).eq('id', mutation.taskId)
      await supabase.from('entries').delete().eq('task_id', mutation.taskId)
      return
    }

    case 'deleteTask': {
      // `on delete cascade` emporte la ligne de compte avec la tache.
      await supabase.from('tasks').delete().eq('id', mutation.taskId)
      return
    }

    case 'addExpense': {
      const e = mutation.expense
      await supabase.from('expenses').insert({
        id: e.id,
        group_id: e.groupId,
        title: e.title,
        emoji: e.emoji,
        amount_cents: e.amountCents,
        payer_id: e.payerId,
        participant_ids: e.participantIds,
        date: e.date,
        receipt_url: e.receipt,
        created_by: e.createdBy,
      })
      break
    }

    case 'updateExpense': {
      const p = mutation.patch
      const row: Row = { updated_at: new Date().toISOString() }
      if (p.title !== undefined) row.title = p.title
      if (p.emoji !== undefined) row.emoji = p.emoji
      if (p.amountCents !== undefined) row.amount_cents = p.amountCents
      if (p.payerId !== undefined) row.payer_id = p.payerId
      if (p.participantIds !== undefined) row.participant_ids = p.participantIds
      if (p.date !== undefined) row.date = p.date
      if (p.receipt !== undefined) row.receipt_url = p.receipt
      await supabase.from('expenses').update(row).eq('id', mutation.expenseId)
      break
    }

    case 'deleteExpense': {
      await supabase.from('expenses').delete().eq('id', mutation.expenseId)
      break
    }
  }
}

export const supabaseStore = {
  load: () => loadAll(),

  async apply(mutation: Mutation) {
    try {
      await applyOne(mutation)
    } catch (error) {
      // L'ecran a deja affiche le geste. Le taire donnerait une application qui
      // ment ; le rejouer tout seul ferait pire. On le signale, et la prochaine
      // synchronisation remettra l'ecran d'accord avec la base.
      console.error('[supabase] ecriture refusee', mutation.type, error)
    }
  },

  /**
   * Le temps reel de 0004_realtime_storage.sql. Les politiques RLS s'appliquent
   * aussi aux messages : on ne recoit que les groupes dont on est membre.
   *
   * A chaque signal on relit tout, plutot que d'appliquer le changement recu.
   * C'est plus de reseau, mais un evenement manque (onglet endormi, reseau
   * coupe) ne laisse pas l'ecran raconter une histoire fausse indefiniment.
   */
  subscribe(onChange: (data: AppData) => void) {
    if (!supabase) return () => {}
    // Capture locale : sans elle, TypeScript perd le retrecissement de type
    // dans la fonction de desabonnement, qui s'execute plus tard.
    const client = supabase

    let pending: ReturnType<typeof setTimeout> | null = null
    const refresh = () => {
      if (pending) clearTimeout(pending)
      // Une validation touche la tache puis l'ecriture : deux signaux pour un
      // seul geste. On attend que la rafale retombe.
      pending = setTimeout(() => {
        loadAll()
          .then(onChange)
          .catch((error) => console.error('[supabase] relecture impossible', error))
      }, 120)
    }

    const channel = client
      .channel('tripduty')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'groups' }, refresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'memberships' }, refresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, refresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'entries' }, refresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses' }, refresh)
      .subscribe()

    return () => {
      if (pending) clearTimeout(pending)
      void client.removeChannel(channel)
    }
  },
}
