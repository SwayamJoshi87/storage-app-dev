import { defineConfig } from 'drizzle-kit'
import { config } from 'dotenv'

config({ path: '.env.local' })

// channel_binding=require causes pg to hang in CLI environments — strip it.
const dbUrl = process.env.DATABASE_URL!.replace('channel_binding=require&', '').replace('&channel_binding=require', '')

export default defineConfig({
  schema: './src/db/schema',
  out: './src/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: dbUrl,
  },
})
