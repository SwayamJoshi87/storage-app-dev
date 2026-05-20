import { createId } from '@paralleldrive/cuid2'
import type { IFileRepository } from '../repositories/interfaces/file.repository.interface'
import type { IVaultRepository } from '../repositories/interfaces/vault.repository.interface'
import type { IStorageProvider } from '../providers/storage/storage.provider.interface'
import type { File } from '@/db/schema/files'
import type { StorageTier, UploadTarget } from '../types'

const PLAN_LIMITS = {
  free:     { coldBytes: 25  * 1024 ** 3, hotBytes: 0 },
  starter:  { coldBytes: 500 * 1024 ** 3, hotBytes: 0 },
  personal: { coldBytes: 2   * 1024 ** 4, hotBytes: 50  * 1024 ** 3 },
  creator:  { coldBytes: 10  * 1024 ** 4, hotBytes: 200 * 1024 ** 3 },
  power:    { coldBytes: 50  * 1024 ** 4, hotBytes: 500 * 1024 ** 3 },
} as const

export class FileService {
  constructor(
    private fileRepo: IFileRepository,
    private vaultRepo: IVaultRepository,
    private storage: IStorageProvider,
  ) {}

  async initiateUpload(
    userId: string,
    vaultId: string,
    fileName: string,
    mimeType: string,
    sizeBytes: number,
    tier: StorageTier,
    userPlan: keyof typeof PLAN_LIMITS,
  ): Promise<{ file: File; uploadTarget: UploadTarget }> {
    // ownership check
    const vault = await this.vaultRepo.findById(vaultId)
    if (!vault || vault.userId !== userId) throw new Error('Vault not found')

    // plan limit check
    const usage = await this.fileRepo.sumStorageByUserId(userId)
    const limits = PLAN_LIMITS[userPlan]
    if (tier === 'cold' && usage.coldBytes + sizeBytes > limits.coldBytes) {
      throw new Error('Cold storage limit reached for your plan')
    }
    if (tier === 'hot' && usage.hotBytes + sizeBytes > limits.hotBytes) {
      throw new Error('Hot storage limit reached for your plan')
    }

    const fileId = createId()
    const key = this.storage.buildKey(userId, vaultId, fileId)

    const file = await this.fileRepo.create({
      id: fileId,
      userId,
      vaultId,
      name: fileName,
      mimeType,
      sizeBytes,
      storageKey: key,
      tier,
      status: 'pending_upload',
    })

    const uploadTarget = await this.storage.getUploadUrl(key, {
      userId,
      vaultId,
      fileId,
      originalName: fileName,
      mimeType,
      sizeBytes,
      tier,
    })

    return { file, uploadTarget }
  }

  async uploadContent(userId: string, fileId: string, body: Buffer, contentType: string): Promise<void> {
    const file = await this.fileRepo.findById(fileId)
    if (!file || file.userId !== userId) throw new Error('File not found')
    await this.storage.putObject(file.storageKey, body, contentType, file.tier as 'cold' | 'hot')
  }

  async confirmUpload(userId: string, fileId: string): Promise<File> {
    const file = await this.fileRepo.findById(fileId)
    if (!file || file.userId !== userId) throw new Error('File not found')
    await this.storage.transitionStorageClass(file.storageKey, file.tier as 'cold' | 'hot')
    return this.fileRepo.update(fileId, { status: 'active' })
  }

  async getStorageUsage(userId: string): Promise<{ coldBytes: number; hotBytes: number }> {
    return this.fileRepo.sumStorageByUserId(userId)
  }

  async listFiles(userId: string, vaultId: string): Promise<File[]> {
    const vault = await this.vaultRepo.findById(vaultId)
    if (!vault || vault.userId !== userId) throw new Error('Vault not found')
    return this.fileRepo.findByVaultId(vaultId)
  }

  async deleteFile(userId: string, fileId: string): Promise<void> {
    const file = await this.fileRepo.findById(fileId)
    if (!file || file.userId !== userId) throw new Error('File not found')
    await this.storage.deleteObject(file.storageKey)
    await this.fileRepo.delete(fileId)
  }
}
