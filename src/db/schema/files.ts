import { pgEnum, pgTable, text, timestamp, bigint } from 'drizzle-orm/pg-core'
import { users } from './users'
import { vaults } from './vaults'

export const storageTierEnum = pgEnum('storage_tier', ['hot', 'cold'])

export const fileStatusEnum = pgEnum('file_status', [
  'pending_upload', // pre-signed URL issued, not yet confirmed
  'active',         // stored in S3/Glacier
  'restoring',      // retrieval job in progress
  'ready',          // restored and available for download
  'deleted',
])

export const files = pgTable('files', {
  id: text('id').primaryKey(), // cuid
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  vaultId: text('vault_id').notNull().references(() => vaults.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  mimeType: text('mime_type').notNull(),
  sizeBytes: bigint('size_bytes', { mode: 'number' }).notNull(),
  storageKey: text('storage_key').notNull(), // S3 object key
  tier: storageTierEnum('tier').notNull().default('cold'),
  status: fileStatusEnum('status').notNull().default('pending_upload'),
  checksumSha256: text('checksum_sha256'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export type File = typeof files.$inferSelect
export type NewFile = typeof files.$inferInsert
