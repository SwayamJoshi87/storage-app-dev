import type { User } from '@/db/schema/users'

export interface IUserRepository {
  findById(id: string): Promise<User | null>
  upsert(data: { id: string; email: string }): Promise<User>
}
