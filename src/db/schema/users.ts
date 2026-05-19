import { pgEnum, pgTable, text, timestamp, integer } from 'drizzle-orm/pg-core'

export const planEnum = pgEnum('plan', ['free', 'starter', 'personal', 'creator', 'power'])

export const users = pgTable('users', {
  id: text('id').primaryKey(), // Clerk user ID
  email: text('email').notNull().unique(),
  plan: planEnum('plan').notNull().default('free'),
  stripeCustomerId: text('stripe_customer_id'),
  stripeSubscriptionId: text('stripe_subscription_id'),
  coldStorageUsedBytes: integer('cold_storage_used_bytes').notNull().default(0),
  hotStorageUsedBytes: integer('hot_storage_used_bytes').notNull().default(0),
  retrievalsUsedThisMonth: integer('retrievals_used_this_month').notNull().default(0),
  retrievalsResetAt: timestamp('retrievals_reset_at').notNull().defaultNow(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
