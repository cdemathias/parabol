import {Client} from 'pg'
import {r} from 'rethinkdb-ts'
import connectRethinkDB from '../../database/connectRethinkDB'
import getPgConfig from '../getPgConfig'

export async function up() {
  await connectRethinkDB()
  const client = new Client(getPgConfig())
  await client.connect()
  const securedDomains = (await r.table('SecureDomain').coerceTo('array').run()) as {
    id: string
    domain: string
  }[]
  try {
    await Promise.all(
      securedDomains.map((sd) => {
        return client.query(
          `
    INSERT INTO "OrganizationApprovedDomain" ("domain", "orgId", "addedByUserId")
    VALUES($1, $2, $3)`,
          [sd.domain.trim().toLowerCase(), 'aGhostOrg', 'aGhostUser']
        )
      })
    )
  } catch {
    // already exists
  }
  await client.end()
  await r.getPoolMaster()?.drain()
}

export async function down() {
  const client = new Client(getPgConfig())
  await client.connect()
  await client.query(`
  DELETE FROM "OrganizationApprovedDomain"
  WHERE "userId" = "aGhostUser";`)
  await client.end()
}
