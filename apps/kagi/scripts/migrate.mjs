/**
 * Programmatic migration runner — used by the Docker migrate service.
 * Runs all pending SQL migrations from drizzle/migrations/ against the database.
 *
 * Usage: node scripts/migrate.mjs
 */

import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import pg from 'pg'
import { fileURLToPath } from 'url'
import path from 'path'

const { Pool } = pg

const url = process.env.DATABASE_URL
if (!url) {
  console.error('ERROR: DATABASE_URL is not set')
  process.exit(1)
}

const migrationsFolder = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '../drizzle/migrations'
)

const pool = new Pool({ connectionString: url })
const db = drizzle(pool)

console.log('Running migrations...')
await migrate(db, { migrationsFolder })
console.log('Migrations complete.')

await pool.end()
