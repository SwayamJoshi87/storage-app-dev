import { pgEnum, pgTable, text, timestamp } from 'drizzle-orm/pg-core'

export const planEnum = pgEnum('plan', ['free', 'starter', 'personal', 'creator', 'power'])

export const users = pgTable('users', {
  id: text('id').primaryKey(), // auth user ID
  email: text('email').notNull().unique(),
  plan: planEnum('plan').notNull().default('free'),
  stripeCustomerId: text('stripe_customer_id'),
  stripeSubscriptionId: text('stripe_subscription_id'),
  // Storage and retrieval usage are computed from the files/retrievals tables.
  googleAccessToken: text('google_access_token'),
  googleRefreshToken: text('google_refresh_token'),
  googleTokenExpiry: timestamp('google_token_expiry'),
  onedriveAccessToken: text('onedrive_access_token'),
  onedriveRefreshToken: text('onedrive_refresh_token'),
  onedriveTokenExpiry: timestamp('onedrive_token_expiry'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
