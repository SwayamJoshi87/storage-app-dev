import { config } from 'dotenv'
import { neon } from '@neondatabase/serverless'

config({ path: '.env.local' })

const url = process.env.DATABASE_URL
  .replace('channel_binding=require&', '')
  .replace('&channel_binding=require', '')

const sql = neon(url)

await sql`TRUNCATE TABLE retrievals, files, vaults, users RESTART IDENTITY CASCADE`
console.log('✓ All tables cleared')
