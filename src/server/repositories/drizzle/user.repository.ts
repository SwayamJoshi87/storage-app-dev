import { eq } from 'drizzle-orm'
import { db } from '@/db/client'
import { users } from '@/db/schema/users'
import type { User } from '@/db/schema/users'
import type { IUserRepository } from '../interfaces/user.repository.interface'

export class DrizzleUserRepository implements IUserRepository {
  async findById(id: string): Promise<User | null> {
    const rows = await db.select().from(users).where(eq(users.id, id)).limit(1)
    return rows[0] ?? null
  }

  async findByStripeCustomerId(stripeCustomerId: string): Promise<User | null> {
    const rows = await db.select().from(users).where(eq(users.stripeCustomerId, stripeCustomerId)).limit(1)
    return rows[0] ?? null
  }

  async upsert(data: { id: string; email: string }): Promise<User> {
    const rows = await db
      .insert(users)
      .values({ id: data.id, email: data.email })
      .onConflictDoUpdate({
        target: users.id,
        set: { email: data.email, updatedAt: new Date() },
      })
      .returning()
    return rows[0]
  }

  async update(
    id: string,
    data: Partial<Pick<User, 'plan' | 'stripeCustomerId' | 'stripeSubscriptionId'>>,
  ): Promise<User> {
    const rows = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning()
    return rows[0]
  }
}
