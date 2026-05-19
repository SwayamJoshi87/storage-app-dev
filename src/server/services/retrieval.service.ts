import { createId } from '@paralleldrive/cuid2'
import type { IRetrievalRepository } from '../repositories/interfaces/retrieval.repository.interface'
import type { IFileRepository } from '../repositories/interfaces/file.repository.interface'
import type { IStorageProvider } from '../providers/storage/storage.provider.interface'
import type { IQueueProvider } from '../providers/queue/queue.provider.interface'
import type { Retrieval } from '@/db/schema/retrievals'
import type { RetrievalTier } from '../types'

const RETRIEVAL_LIMITS = {
  free: 1, starter: 3, personal: 5, creator: 15, power: 40,
} as const

// Poll every 30 minutes to check if the Glacier restore is complete
const POLL_INTERVAL_SECONDS = 1800

export class RetrievalService {
  constructor(
    private retrievalRepo: IRetrievalRepository,
    private fileRepo: IFileRepository,
    private storage: IStorageProvider,
    private queue: IQueueProvider,
  ) {}

  async requestRetrieval(
    userId: string,
    fileId: string,
    tier: RetrievalTier,
    userPlan: keyof typeof RETRIEVAL_LIMITS,
  ): Promise<Retrieval> {
    const file = await this.fileRepo.findById(fileId)
    if (!file || file.userId !== userId) throw new Error('File not found')
    if (file.tier !== 'cold') throw new Error('File is already on hot tier')

    const usedThisMonth = await this.retrievalRepo.countThisMonthByUserId(userId)
    if (usedThisMonth >= RETRIEVAL_LIMITS[userPlan]) {
      throw new Error('Monthly retrieval limit reached for your plan')
    }

    await this.storage.initiateRetrieval(file.storageKey, tier)
    await this.fileRepo.update(fileId, { status: 'restoring' })

    const retrieval = await this.retrievalRepo.create({
      id: createId(),
      userId,
      fileId,
      tier,
      status: 'restoring',
    })

    // Schedule a background job to poll Glacier status
    await this.queue.enqueue(
      '/api/webhooks/retrieval-poll',
      { retrievalId: retrieval.id },
      POLL_INTERVAL_SECONDS,
    )

    return retrieval
  }

  async pollRetrievalStatus(retrievalId: string): Promise<Retrieval> {
    const retrieval = await this.retrievalRepo.findById(retrievalId)
    if (!retrieval) throw new Error('Retrieval not found')

    const file = await this.fileRepo.findById(retrieval.fileId)
    if (!file) throw new Error('File not found')

    const status = await this.storage.getRetrievalStatus(file.storageKey)

    if (status === 'ready') {
      const downloadUrl = await this.storage.getDownloadUrl(file.storageKey, 3600)
      const downloadExpiresAt = new Date(Date.now() + 3600 * 1000)

      await this.fileRepo.update(file.id, { status: 'ready' })
      return this.retrievalRepo.update(retrievalId, {
        status: 'ready',
        downloadUrl,
        downloadExpiresAt,
      })
    }

    if (status === 'restoring') {
      // Re-queue another poll
      await this.queue.enqueue(
        '/api/webhooks/retrieval-poll',
        { retrievalId },
        POLL_INTERVAL_SECONDS,
      )
    }

    return retrieval
  }

  async listPendingRetrievals(userId: string): Promise<Retrieval[]> {
    return this.retrievalRepo.findPendingByUserId(userId)
  }
}
