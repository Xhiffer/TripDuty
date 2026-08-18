import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'

const here = dirname(fileURLToPath(import.meta.url))

export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
})

export async function migrate() {
  const sql = await readFile(join(here, 'schema.sql'), 'utf8')
  await pool.query(sql)
}

/** Toute ecriture passe par la, pour que les telephones sachent qu'il faut recharger. */
export async function bumpVersion(client, groupId) {
  await client.query(
    `insert into group_versions (group_id, version, bumped_at)
     values ($1, 1, now())
     on conflict (group_id) do update set version = group_versions.version + 1, bumped_at = now()`,
    [groupId],
  )
}

/** Execute plusieurs requetes dans une transaction, en remontant la version du groupe. */
export async function withGroupTransaction(groupId, run) {
  const client = await pool.connect()
  try {
    await client.query('begin')
    const result = await run(client)
    await bumpVersion(client, groupId)
    await client.query('commit')
    return result
  } catch (error) {
    await client.query('rollback')
    throw error
  } finally {
    client.release()
  }
}
