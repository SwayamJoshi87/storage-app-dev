import 'dotenv/config'
import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { Pool } from 'pg'
import { resolve } from 'path'

// Strip channel_binding — not supported by pg driver
const url = process.env.DATABASE_URL!
  .replace('channel_binding=require&', '')
  .replace('&channel_binding=require', '')

const pool = new Pool({ connectionString: url, ssl: { rejectUnauthorized: false } })
const db = drizzle(pool)

migrate(db, { migrationsFolder: resolve(__dirname, 'migrations') })
  .then(() => {
    console.log('✓ Migrations applied successfully')
    pool.end()
    process.exit(0)
  })
  .catch((err) => {
    console.error('Migration failed:', err)
    pool.end()
    process.exit(1)
  })
