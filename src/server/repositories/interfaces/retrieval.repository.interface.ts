import type { Retrieval, NewRetrieval } from '@/db/schema/retrievals'

export interface IRetrievalRepository {
  findById(id: string): Promise<Retrieval | null>
  findByFileId(fileId: string): Promise<Retrieval[]>
  findPendingByUserId(userId: string): Promise<Retrieval[]>
  create(retrieval: NewRetrieval): Promise<Retrieval>
  update(id: string, data: Partial<Retrieval>): Promise<Retrieval>
  countThisMonthByUserId(userId: string): Promise<number>
}
