import type { User } from '@/db/schema/users'

export interface IUserRepository {
  findById(id: string): Promise<User | null>
  findByStripeCustomerId(stripeCustomerId: string): Promise<User | null>
  upsert(data: { id: string; email: string }): Promise<User>
  update(id: string, data: Partial<Pick<User, 'plan' | 'stripeCustomerId' | 'stripeSubscriptionId'>>): Promise<User>
}
