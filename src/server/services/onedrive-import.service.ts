import { createId } from '@paralleldrive/cuid2'
import type { IFileRepository } from '../repositories/interfaces/file.repository.interface'
import type { IVaultRepository } from '../repositories/interfaces/vault.repository.interface'
import type { IUserRepository } from '../repositories/interfaces/user.repository.interface'
import type { IStorageProvider } from '../providers/storage/storage.provider.interface'
import type { IQueueProvider } from '../providers/queue/queue.provider.interface'
import type { IOneDriveProvider, OneDriveItem } from '../providers/onedrive/onedrive.provider.interface'
import type { File } from '@/db/schema/files'

export class OneDriveImportService {
  constructor(
    private fileRepo: IFileRepository,
    private vaultRepo: IVaultRepository,
    private userRepo: IUserRepository,
    private storage: IStorageProvider,
    private queue: IQueueProvider,
    private onedrive: IOneDriveProvider,
  ) {}

  private async getFreshAccessToken(userId: string): Promise<string> {
    const user = await this.userRepo.findById(userId)
    if (!user?.onedriveAccessToken) throw new Error('OneDrive not connected')

    if (user.onedriveTokenExpiry && user.onedriveTokenExpiry < new Date()) {
      if (!user.onedriveRefreshToken) throw new Error('No OneDrive refresh token — reconnect OneDrive')
      const refreshed = await this.onedrive.refreshAccessToken(user.onedriveRefreshToken)
      await this.userRepo.updateOnedriveTokens(userId, {
        onedriveAccessToken: refreshed.accessToken,
        onedriveRefreshToken: user.onedriveRefreshToken,
        onedriveTokenExpiry: refreshed.expiresAt,
      })
      return refreshed.accessToken
    }

    return user.onedriveAccessToken
  }

  async listItems(userId: string, itemId?: string): Promise<OneDriveItem[]> {
    const accessToken = await this.getFreshAccessToken(userId)
    return this.onedrive.listItems(accessToken, itemId)
  }

  async enqueueImport(
    userId: string,
    vaultId: string,
    items: OneDriveItem[],
  ): Promise<{ fileId: string; onedriveItemId: string }[]> {
    const vault = await this.vaultRepo.findById(vaultId)
    if (!vault || vault.userId !== userId) throw new Error('Vault not found')

    const results: { fileId: string; onedriveItemId: string }[] = []

    for (const item of items) {
      if (item.isFolder) continue

      const fileId = createId()
      const key = this.storage.buildKey(userId, vaultId, fileId)

      await this.fileRepo.create({
        id: fileId,
        userId,
        vaultId,
        name: item.name,
        mimeType: item.mimeType,
        sizeBytes: item.sizeBytes,
        storageKey: key,
        tier: 'cold',
        status: 'importing',
        onedriveDriveItemId: item.id,
      })

      await this.queue.enqueue('/api/webhooks/import-onedrive', {
        fileId,
        onedriveItemId: item.id,
        userId,
      })

      results.push({ fileId, onedriveItemId: item.id })
    }

    return results
  }

  async getImportStatus(userId: string): Promise<File[]> {
    return this.fileRepo.findOneDriveImportsByUserId(userId)
  }

  async processImportJob(fileId: string, onedriveItemId: string, userId: string): Promise<void> {
    const file = await this.fileRepo.findById(fileId)
    if (!file || file.userId !== userId) throw new Error('File not found')

    let accessToken: string
    try {
      accessToken = await this.getFreshAccessToken(userId)
    } catch (err) {
      await this.fileRepo.update(fileId, { status: 'failed' })
      throw err
    }

    try {
      const stream = await this.onedrive.getFileStream(accessToken, onedriveItemId)
      await this.storage.putObjectFromStream(file.storageKey, stream, file.mimeType, file.sizeBytes, 'cold')
      await this.fileRepo.update(fileId, { status: 'active' })
    } catch (err) {
      await this.fileRepo.update(fileId, { status: 'failed' })
      throw err
    }
  }
}
