import { eq, and, gte, count } from 'drizzle-orm'
import { db } from '@/db/client'
import { retrievals } from '@/db/schema/retrievals'
import type { Retrieval, NewRetrieval } from '@/db/schema/retrievals'
import type { IRetrievalRepository } from '../interfaces/retrieval.repository.interface'

export class DrizzleRetrievalRepository implements IRetrievalRepository {
  async findById(id: string): Promise<Retrieval | null> {
    const rows = await db.select().from(retrievals).where(eq(retrievals.id, id)).limit(1)
    return rows[0] ?? null
  }

  async findByFileId(fileId: string): Promise<Retrieval[]> {
    return db.select().from(retrievals).where(eq(retrievals.fileId, fileId))
  }

  async findPendingByUserId(userId: string): Promise<Retrieval[]> {
    return db
      .select()
      .from(retrievals)
      .where(
        and(eq(retrievals.userId, userId), eq(retrievals.status, 'restoring')),
      )
  }

  async create(retrieval: NewRetrieval): Promise<Retrieval> {
    const rows = await db.insert(retrievals).values(retrieval).returning()
    return rows[0]
  }

  async update(id: string, data: Partial<Retrieval>): Promise<Retrieval> {
    const rows = await db
      .update(retrievals)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(retrievals.id, id))
      .returning()
    return rows[0]
  }

  async countThisMonthByUserId(userId: string): Promise<number> {
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const [result] = await db
      .select({ total: count() })
      .from(retrievals)
      .where(
        and(
          eq(retrievals.userId, userId),
          gte(retrievals.createdAt, startOfMonth),
        ),
      )
    return result?.total ?? 0
  }
}
