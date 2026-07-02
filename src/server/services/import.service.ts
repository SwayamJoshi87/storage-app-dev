import { createId } from '@paralleldrive/cuid2'
import type { IFileRepository } from '../repositories/interfaces/file.repository.interface'
import type { IVaultRepository } from '../repositories/interfaces/vault.repository.interface'
import type { IUserRepository } from '../repositories/interfaces/user.repository.interface'
import type { IStorageProvider } from '../providers/storage/storage.provider.interface'
import type { IQueueProvider } from '../providers/queue/queue.provider.interface'
import type { IGDriveProvider, DriveItem } from '../providers/gdrive/gdrive.provider.interface'
import type { File } from '@/db/schema/files'

export class ImportService {
  constructor(
    private fileRepo: IFileRepository,
    private vaultRepo: IVaultRepository,
    private userRepo: IUserRepository,
    private storage: IStorageProvider,
    private queue: IQueueProvider,
    private gdrive: IGDriveProvider,
  ) {}

  private async getFreshAccessToken(userId: string): Promise<string> {
    const user = await this.userRepo.findById(userId)
    if (!user?.googleAccessToken) throw new Error('Google Drive not connected')

    if (user.googleTokenExpiry && user.googleTokenExpiry < new Date()) {
      if (!user.googleRefreshToken) throw new Error('No Google refresh token — reconnect Google Drive')
      const refreshed = await this.gdrive.refreshAccessToken(user.googleRefreshToken)
      await this.userRepo.updateGoogleTokens(userId, {
        googleAccessToken: refreshed.accessToken,
        googleRefreshToken: user.googleRefreshToken,
        googleTokenExpiry: refreshed.expiresAt,
      })
      return refreshed.accessToken
    }

    return user.googleAccessToken
  }

  async listDriveItems(userId: string, folderId?: string): Promise<DriveItem[]> {
    const accessToken = await this.getFreshAccessToken(userId)
    return this.gdrive.listItems(accessToken, folderId)
  }

  async enqueueImport(
    userId: string,
    vaultId: string,
    driveFiles: DriveItem[],
  ): Promise<{ fileId: string; driveFileId: string }[]> {
    const vault = await this.vaultRepo.findById(vaultId)
    if (!vault || vault.userId !== userId) throw new Error('Vault not found')

    const results: { fileId: string; driveFileId: string }[] = []

    for (const driveFile of driveFiles) {
      if (driveFile.isFolder) continue

      const fileId = createId()
      const key = this.storage.buildKey(userId, vaultId, fileId)

      await this.fileRepo.create({
        id: fileId,
        userId,
        vaultId,
        name: driveFile.name,
        mimeType: driveFile.mimeType,
        sizeBytes: driveFile.sizeBytes,
        storageKey: key,
        tier: 'cold',
        status: 'importing',
        googleDriveFileId: driveFile.id,
      })

      await this.queue.enqueue('/api/webhooks/import-google', {
        fileId,
        googleDriveFileId: driveFile.id,
        userId,
      })

      results.push({ fileId, driveFileId: driveFile.id })
    }

    return results
  }

  async getImportStatus(userId: string): Promise<File[]> {
    return this.fileRepo.findGoogleDriveImportsByUserId(userId)
  }

  async processImportJob(fileId: string, googleDriveFileId: string, userId: string): Promise<void> {
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
      const stream = await this.gdrive.getFileStream(accessToken, googleDriveFileId)
      await this.storage.putObjectFromStream(file.storageKey, stream, file.mimeType, file.sizeBytes, 'cold')
      await this.fileRepo.update(fileId, { status: 'active' })
    } catch (err) {
      await this.fileRepo.update(fileId, { status: 'failed' })
      throw err
    }
  }
}
