import express from 'express'
import cookieParser from 'cookie-parser'
import { migrate, pool, withGroupTransaction } from './db.js'
import { checkPassword, clearSession, hashPassword, requireAuth, setSession } from './auth.js'
import { completionAmounts, penaltyAmounts } from './ledger.js'
import { CLOSING_CATALOG, makeInviteCode } from './closing.js'

const app = express()
app.set('trust proxy', 1)
app.use(express.json({ limit: '2mb' })) // les photos de profil voyagent en base64
app.use(cookieParser())

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// ---------------------------------------------------------------------------
// Mise en forme
// ---------------------------------------------------------------------------

const toAccount = (r) => ({
  id: r.id,
  email: r.email,
  firstName: r.first_name,
  lastName: r.last_name,
  birthDate: r.birth_date ? r.birth_date.toISOString().slice(0, 10) : '',
  photo: r.photo,
  color: r.color,
  createdAt: r.created_at.toISOString(),
})

const toGroup = (r) => ({
  id: r.id,
  kind: r.kind,
  name: r.name,
  emoji: r.emoji,
  color: r.color,
  startDate: r.start_date.toISOString().slice(0, 10),
  endDate: r.end_date.toISOString().slice(0, 10),
  hostId: r.host_id,
  inviteCode: r.invite_code,
  penalty: r.penalty,
  closingOpen: r.closing_open,
  createdAt: r.created_at.toISOString(),
})

const toTask = (r) => ({
  id: r.id,
  groupId: r.group_id,
  title: r.title,
  titleKey: r.title_key ?? undefined,
  emoji: r.emoji,
  points: r.points,
  date: r.date.toISOString().slice(0, 10),
  time: r.time,
  needsLicense: r.needs_license,
  beneficiaryIds: r.beneficiary_ids,
  assignedTo: r.assigned_to,
  status: r.status,
  createdBy: r.created_by,
  recurring: r.recurring,
  isClosing: r.is_closing,
})

const toEntry = (r) => ({
  id: r.id,
  groupId: r.group_id,
  taskId: r.task_id,
  kind: r.kind,
  doerIds: r.doer_ids,
  beneficiaryIds: r.beneficiary_ids,
  amounts: r.amounts,
  validatedBy: r.validated_by,
  at: r.at.toISOString(),
})

// ---------------------------------------------------------------------------
// Appartenance au groupe
// ---------------------------------------------------------------------------

async function membershipOf(groupId, accountId) {
  const { rows } = await pool.query(
    'select * from memberships where group_id = $1 and account_id = $2',
    [groupId, accountId],
  )
  return rows[0] ?? null
}

/** Toute route de groupe verifie d'abord que la personne en fait partie. */
function inGroup(minimumRole = 'member') {
  return async (req, res, next) => {
    const membership = await membershipOf(req.params.groupId, req.accountId)
    if (!membership) return res.status(403).json({ error: 'notInGroup' })
    const isChef = membership.role === 'host' || membership.role === 'chef'
    if (minimumRole === 'chef' && !isChef) return res.status(403).json({ error: 'chefOnly' })
    if (minimumRole === 'host' && membership.role !== 'host') return res.status(403).json({ error: 'hostOnly' })
    req.membership = membership
    next()
  }
}

async function beneficiariesFor(task, groupId) {
  if (task.beneficiary_ids) return task.beneficiary_ids
  const { rows } = await pool.query('select account_id from memberships where group_id = $1', [groupId])
  return rows.map((r) => r.account_id)
}

// ---------------------------------------------------------------------------
// Comptes
// ---------------------------------------------------------------------------

app.post('/api/auth/signup', async (req, res) => {
  const email = String(req.body?.email ?? '').trim().toLowerCase()
  const password = String(req.body?.password ?? '')
  if (!EMAIL.test(email)) return res.status(400).json({ error: 'badEmail' })
  if (password.length < 6) return res.status(400).json({ error: 'passwordShort' })

  const existing = await pool.query('select id from accounts where lower(email) = $1', [email])
  if (existing.rowCount > 0) return res.status(409).json({ error: 'emailTaken' })

  const { rows } = await pool.query(
    'insert into accounts (email, password_hash) values ($1, $2) returning *',
    [email, await hashPassword(password)],
  )
  setSession(req, res, rows[0].id)
  res.json({ account: toAccount(rows[0]) })
})

app.post('/api/auth/signin', async (req, res) => {
  const email = String(req.body?.email ?? '').trim().toLowerCase()
  const password = String(req.body?.password ?? '')
  const { rows } = await pool.query('select * from accounts where lower(email) = $1', [email])
  if (rows.length === 0) return res.status(401).json({ error: 'unknownAccount' })
  if (!(await checkPassword(password, rows[0].password_hash))) {
    return res.status(401).json({ error: 'wrongPassword' })
  }
  setSession(req, res, rows[0].id)
  res.json({ account: toAccount(rows[0]) })
})

app.post('/api/auth/signout', (req, res) => {
  clearSession(res)
  res.json({ ok: true })
})

/** Le compte et la liste de ses groupes, c'est ce que l'application charge au demarrage. */
app.get('/api/me', requireAuth, async (req, res) => {
  const account = await pool.query('select * from accounts where id = $1', [req.accountId])
  if (account.rows.length === 0) {
    clearSession(res)
    return res.status(401).json({ error: 'notSignedIn' })
  }
  const groups = await pool.query(
    `select g.* from groups g
     join memberships m on m.group_id = g.id
     where m.account_id = $1
     order by g.created_at desc`,
    [req.accountId],
  )
  const counts = await pool.query(
    `select group_id, count(*)::int as n from memberships
     where group_id = any($1::uuid[]) group by group_id`,
    [groups.rows.map((g) => g.id)],
  )
  const byGroup = Object.fromEntries(counts.rows.map((r) => [r.group_id, r.n]))
  res.json({
    account: toAccount(account.rows[0]),
    groups: groups.rows.map((g) => ({ ...toGroup(g), memberCount: byGroup[g.id] ?? 1 })),
  })
})

app.patch('/api/me', requireAuth, async (req, res) => {
  const { firstName, lastName, birthDate, photo, color } = req.body ?? {}
  const { rows } = await pool.query(
    `update accounts set
       first_name = coalesce($2, first_name),
       last_name  = coalesce($3, last_name),
       birth_date = coalesce($4, birth_date),
       photo      = $5,
       color      = coalesce($6, color)
     where id = $1 returning *`,
    [req.accountId, firstName ?? null, lastName ?? null, birthDate || null, photo ?? null, color ?? null],
  )
  res.json({ account: toAccount(rows[0]) })
})

// ---------------------------------------------------------------------------
// Groupes
// ---------------------------------------------------------------------------

app.post('/api/groups', requireAuth, async (req, res) => {
  const { kind, name, emoji, color, startDate, endDate, hasLicense } = req.body ?? {}
  if (!['vacances', 'couple', 'potes'].includes(kind)) return res.status(400).json({ error: 'badKind' })
  if (!String(name ?? '').trim()) return res.status(400).json({ error: 'nameRequired' })
  if (!startDate || !endDate || endDate < startDate) return res.status(400).json({ error: 'badDates' })

  const client = await pool.connect()
  try {
    await client.query('begin')
    const group = await client.query(
      `insert into groups (kind, name, emoji, color, start_date, end_date, host_id, invite_code)
       values ($1, $2, $3, $4, $5, $6, $7, $8) returning *`,
      [kind, String(name).trim(), emoji ?? '⛰️', color ?? '#ff6a3d', startDate, endDate, req.accountId, makeInviteCode()],
    )
    const groupId = group.rows[0].id
    await client.query(
      `insert into memberships (group_id, account_id, role, has_license) values ($1, $2, 'host', $3)`,
      [groupId, req.accountId, !!hasLicense],
    )
    // Les taches de cloture sont pre-remplies, le chef les modifie ensuite.
    for (const c of CLOSING_CATALOG) {
      await client.query(
        `insert into tasks (group_id, title, title_key, emoji, points, date, time, needs_license, created_by, is_closing)
         values ($1, $2, $3, $4, $5, $6, '10:00', $7, $8, true)`,
        [groupId, c.fr, c.key, c.emoji, c.points, endDate, c.needsLicense, req.accountId],
      )
    }
    await client.query('insert into group_versions (group_id) values ($1)', [groupId])
    await client.query('commit')
    res.json({ group: toGroup(group.rows[0]) })
  } catch (error) {
    await client.query('rollback')
    throw error
  } finally {
    client.release()
  }
})

app.post('/api/groups/join', requireAuth, async (req, res) => {
  const code = String(req.body?.code ?? '').trim().toUpperCase()
  const { rows } = await pool.query('select * from groups where upper(invite_code) = $1', [code])
  if (rows.length === 0) return res.status(404).json({ error: 'unknownCode' })
  await pool.query(
    `insert into memberships (group_id, account_id) values ($1, $2) on conflict do nothing`,
    [rows[0].id, req.accountId],
  )
  res.json({ group: toGroup(rows[0]) })
})

/** Tout ce dont un ecran a besoin pour un groupe, en une seule requete. */
app.get('/api/groups/:groupId', requireAuth, inGroup(), async (req, res) => {
  const { groupId } = req.params
  const [group, members, tasks, entries, version] = await Promise.all([
    pool.query('select * from groups where id = $1', [groupId]),
    pool.query(
      `select a.id, a.first_name, a.last_name, a.photo, a.color, m.role, m.has_license, m.joined_at
       from memberships m join accounts a on a.id = m.account_id
       where m.group_id = $1 order by m.joined_at`,
      [groupId],
    ),
    pool.query('select * from tasks where group_id = $1', [groupId]),
    pool.query('select * from entries where group_id = $1', [groupId]),
    pool.query('select version from group_versions where group_id = $1', [groupId]),
  ])

  res.json({
    group: toGroup(group.rows[0]),
    members: members.rows.map((r) => ({
      id: r.id,
      name: r.first_name || '?',
      lastName: r.last_name,
      photo: r.photo,
      color: r.color,
      hasLicense: r.has_license,
      role: r.role,
      joinedAt: r.joined_at.toISOString(),
    })),
    tasks: tasks.rows.map(toTask),
    entries: entries.rows.map(toEntry),
    version: Number(version.rows[0]?.version ?? 1),
  })
})

/** Les telephones demandent seulement si quelque chose a bouge. */
app.get('/api/groups/:groupId/version', requireAuth, inGroup(), async (req, res) => {
  const { rows } = await pool.query('select version from group_versions where group_id = $1', [req.params.groupId])
  res.json({ version: Number(rows[0]?.version ?? 1) })
})

app.patch('/api/groups/:groupId', requireAuth, inGroup('chef'), async (req, res) => {
  const { name, startDate, endDate, penalty, closingOpen, emoji, color } = req.body ?? {}
  await withGroupTransaction(req.params.groupId, (client) =>
    client.query(
      `update groups set
         name = coalesce($2, name),
         start_date = coalesce($3, start_date),
         end_date = coalesce($4, end_date),
         penalty = coalesce($5, penalty),
         closing_open = coalesce($6, closing_open),
         emoji = coalesce($7, emoji),
         color = coalesce($8, color),
         updated_at = now()
       where id = $1`,
      [req.params.groupId, name ?? null, startDate ?? null, endDate ?? null, penalty ?? null,
       closingOpen ?? null, emoji ?? null, color ?? null],
    ),
  )
  res.json({ ok: true })
})

// L'invitation par e-mail ne marche que si la personne a deja un compte.
app.post('/api/groups/:groupId/invite', requireAuth, inGroup(), async (req, res) => {
  const email = String(req.body?.email ?? '').trim().toLowerCase()
  const { rows } = await pool.query('select id from accounts where lower(email) = $1', [email])
  if (rows.length === 0) return res.status(404).json({ error: 'noAccountForEmail' })
  const already = await membershipOf(req.params.groupId, rows[0].id)
  if (already) return res.status(409).json({ error: 'alreadyMember' })
  await withGroupTransaction(req.params.groupId, (client) =>
    client.query('insert into memberships (group_id, account_id) values ($1, $2)', [req.params.groupId, rows[0].id]),
  )
  res.json({ ok: true })
})

app.delete('/api/groups/:groupId/me', requireAuth, inGroup(), async (req, res) => {
  if (req.membership.role === 'host') return res.status(400).json({ error: 'hostCannotLeave' })
  await withGroupTransaction(req.params.groupId, (client) =>
    client.query('delete from memberships where group_id = $1 and account_id = $2', [req.params.groupId, req.accountId]),
  )
  res.json({ ok: true })
})

app.patch('/api/groups/:groupId/members/:accountId', requireAuth, inGroup(), async (req, res) => {
  const { role, hasLicense } = req.body ?? {}
  const target = req.params.accountId
  // Chacun declare son propre permis ; seul l'hote distribue les roles.
  if (role !== undefined && req.membership.role !== 'host') return res.status(403).json({ error: 'hostOnly' })
  if (hasLicense !== undefined && target !== req.accountId && req.membership.role !== 'host') {
    return res.status(403).json({ error: 'hostOnly' })
  }
  await withGroupTransaction(req.params.groupId, (client) =>
    client.query(
      `update memberships set
         role = coalesce($3, role),
         has_license = coalesce($4, has_license)
       where group_id = $1 and account_id = $2 and role <> 'host'`,
      [req.params.groupId, target, role ?? null, hasLicense ?? null],
    ),
  )
  res.json({ ok: true })
})

// ---------------------------------------------------------------------------
// Taches
// ---------------------------------------------------------------------------

app.post('/api/groups/:groupId/tasks', requireAuth, inGroup(), async (req, res) => {
  const t = req.body ?? {}
  const { rows } = await withGroupTransaction(req.params.groupId, (client) =>
    client.query(
      `insert into tasks (group_id, title, title_key, emoji, points, date, time, needs_license,
                          beneficiary_ids, created_by, recurring, is_closing)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) returning *`,
      [
        req.params.groupId,
        String(t.title ?? '').trim() || 'Tâche',
        t.titleKey ?? null,
        t.emoji ?? '🎯',
        Math.max(0, Math.min(1000, Number(t.points) || 0)),
        t.date,
        t.time ?? '19:00',
        !!t.needsLicense,
        t.beneficiaryIds ?? null,
        req.accountId,
        !!t.recurring,
        !!t.isClosing,
      ],
    ),
  )
  res.json({ task: toTask(rows[0]) })
})

app.patch('/api/groups/:groupId/tasks/:taskId', requireAuth, inGroup(), async (req, res) => {
  const { assignedTo, recurring } = req.body ?? {}
  await withGroupTransaction(req.params.groupId, (client) =>
    client.query(
      `update tasks set
         assigned_to = case when $3::boolean then $4::uuid else assigned_to end,
         recurring = coalesce($5, recurring),
         updated_at = now()
       where id = $1 and group_id = $2`,
      [req.params.taskId, req.params.groupId, assignedTo !== undefined, assignedTo ?? null, recurring ?? null],
    ),
  )
  res.json({ ok: true })
})

app.delete('/api/groups/:groupId/tasks/:taskId', requireAuth, inGroup('chef'), async (req, res) => {
  await withGroupTransaction(req.params.groupId, (client) =>
    client.query('delete from tasks where id = $1 and group_id = $2', [req.params.taskId, req.params.groupId]),
  )
  res.json({ ok: true })
})

/** Validation d'une tache : c'est le serveur qui calcule les points. */
app.post('/api/groups/:groupId/tasks/:taskId/validate', requireAuth, inGroup(), async (req, res) => {
  const doerIds = Array.isArray(req.body?.doerIds) ? req.body.doerIds : []
  let beneficiaryIds = Array.isArray(req.body?.beneficiaryIds) ? req.body.beneficiaryIds : []
  if (doerIds.length === 0) return res.status(400).json({ error: 'noDoer' })

  const task = await pool.query('select * from tasks where id = $1 and group_id = $2', [
    req.params.taskId,
    req.params.groupId,
  ])
  if (task.rows.length === 0) return res.status(404).json({ error: 'unknownTask' })
  if (beneficiaryIds.length === 0) beneficiaryIds = await beneficiariesFor(task.rows[0], req.params.groupId)

  const amounts = completionAmounts(task.rows[0].points, doerIds, beneficiaryIds)
  await withGroupTransaction(req.params.groupId, async (client) => {
    await client.query('delete from entries where task_id = $1', [req.params.taskId])
    await client.query(
      `insert into entries (group_id, task_id, kind, doer_ids, beneficiary_ids, amounts, validated_by)
       values ($1, $2, 'completion', $3, $4, $5, $6)`,
      [req.params.groupId, req.params.taskId, doerIds, beneficiaryIds, JSON.stringify(amounts), req.accountId],
    )
    await client.query("update tasks set status = 'done', updated_at = now() where id = $1", [req.params.taskId])
  })
  res.json({ ok: true })
})

/** Le malus ne s'applique que si quelqu'un s'etait engage sur la tache. */
app.post('/api/groups/:groupId/tasks/:taskId/miss', requireAuth, inGroup('chef'), async (req, res) => {
  const task = await pool.query('select * from tasks where id = $1 and group_id = $2', [
    req.params.taskId,
    req.params.groupId,
  ])
  if (task.rows.length === 0) return res.status(404).json({ error: 'unknownTask' })
  if (!task.rows[0].assigned_to) return res.status(400).json({ error: 'nobodyCommitted' })

  const group = await pool.query('select penalty from groups where id = $1', [req.params.groupId])
  const beneficiaryIds = await beneficiariesFor(task.rows[0], req.params.groupId)
  const amounts = penaltyAmounts(group.rows[0].penalty, task.rows[0].assigned_to, beneficiaryIds)

  await withGroupTransaction(req.params.groupId, async (client) => {
    await client.query('delete from entries where task_id = $1', [req.params.taskId])
    await client.query(
      `insert into entries (group_id, task_id, kind, doer_ids, beneficiary_ids, amounts, validated_by)
       values ($1, $2, 'penalty', '{}', $3, $4, $5)`,
      [req.params.groupId, req.params.taskId, beneficiaryIds, JSON.stringify(amounts), req.accountId],
    )
    await client.query("update tasks set status = 'missed', updated_at = now() where id = $1", [req.params.taskId])
  })
  res.json({ ok: true })
})

app.post('/api/groups/:groupId/tasks/:taskId/reopen', requireAuth, inGroup('chef'), async (req, res) => {
  await withGroupTransaction(req.params.groupId, async (client) => {
    await client.query('delete from entries where task_id = $1', [req.params.taskId])
    await client.query("update tasks set status = 'todo', updated_at = now() where id = $1 and group_id = $2", [
      req.params.taskId,
      req.params.groupId,
    ])
  })
  res.json({ ok: true })
})

// ---------------------------------------------------------------------------

app.get('/api/health', async (req, res) => {
  try {
    await pool.query('select 1')
    res.json({ ok: true })
  } catch {
    res.status(503).json({ ok: false })
  }
})

app.use((error, req, res, next) => {
  console.error(error)
  if (res.headersSent) return next(error)
  res.status(500).json({ error: 'serverError' })
})

const port = Number(process.env.PORT ?? 8080)
await migrate()
app.listen(port, () => console.log(`Trip Duty API sur le port ${port}`))
