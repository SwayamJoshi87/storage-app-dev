import { pgTable, text, timestamp, boolean } from 'drizzle-orm/pg-core'
import { users } from './users'

export const vaults = pgTable('vaults', {
  id: text('id').primaryKey(), // cuid
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  isArchived: boolean('is_archived').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export type Vault = typeof vaults.$inferSelect
export type NewVault = typeof vaults.$inferInsert
