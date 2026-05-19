import { pgEnum, pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { users } from './users'
import { files } from './files'

export const retrievalTierEnum = pgEnum('retrieval_tier', ['bulk', 'standard'])

export const retrievalStatusEnum = pgEnum('retrieval_status', [
  'pending',
  'restoring',
  'ready',
  'expired',
  'failed',
])

export const retrievals = pgTable('retrievals', {
  id: text('id').primaryKey(), // cuid
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  fileId: text('file_id').notNull().references(() => files.id, { onDelete: 'cascade' }),
  glacierJobId: text('glacier_job_id'), // AWS job ID returned on restore initiation
  tier: retrievalTierEnum('tier').notNull().default('bulk'),
  status: retrievalStatusEnum('status').notNull().default('pending'),
  downloadUrl: text('download_url'),   // pre-signed URL, set when ready
  downloadExpiresAt: timestamp('download_expires_at'),
  notifiedAt: timestamp('notified_at'), // when email was sent
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export type Retrieval = typeof retrievals.$inferSelect
export type NewRetrieval = typeof retrievals.$inferInsert
