import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  RestoreObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import type { IStorageProvider } from './storage.provider.interface'
import type { FileMetadata, RetrievalTier, RetrievalStatus, UploadTarget } from '../../types'

const BUCKET = process.env.AWS_S3_BUCKET!
const REGION = process.env.AWS_REGION!

const s3 = new S3Client({ region: REGION })

export class S3GlacierProvider implements IStorageProvider {
  buildKey(userId: string, vaultId: string, fileId: string): string {
    return `users/${userId}/vaults/${vaultId}/${fileId}`
  }

  async getUploadUrl(
    key: string,
    metadata: FileMetadata,
    expiresInSeconds = 900,
  ): Promise<UploadTarget> {
    const command = new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      StorageClass: metadata.tier === 'cold' ? 'DEEP_ARCHIVE' : 'STANDARD_IA',
      ContentType: metadata.mimeType,
      Tagging: `userId=${metadata.userId}&vaultId=${metadata.vaultId}&plan=free`,
    })

    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: expiresInSeconds })
    return {
      uploadUrl,
      key,
      expiresAt: new Date(Date.now() + expiresInSeconds * 1000),
    }
  }

  async initiateRetrieval(key: string, tier: RetrievalTier): Promise<string> {
    const restoreTier = tier === 'bulk' ? 'Bulk' : 'Standard'
    await s3.send(
      new RestoreObjectCommand({
        Bucket: BUCKET,
        Key: key,
        RestoreRequest: { Days: 2, GlacierJobParameters: { Tier: restoreTier } },
      }),
    )
    // AWS does not return a job ID for S3 Glacier restore — key is the identifier
    return key
  }

  async getRetrievalStatus(key: string): Promise<RetrievalStatus> {
    const head = await s3.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }))
    const restore = head.Restore ?? ''
    if (restore.includes('ongoing-request="true"')) return 'restoring'
    if (restore.includes('ongoing-request="false"')) return 'ready'
    return 'pending'
  }

  async getDownloadUrl(key: string, expiresInSeconds = 3600): Promise<string> {
    const { GetObjectCommand } = await import('@aws-sdk/client-s3')
    const command = new GetObjectCommand({ Bucket: BUCKET, Key: key })
    return getSignedUrl(s3, command, { expiresIn: expiresInSeconds })
  }

  async deleteObject(key: string): Promise<void> {
    await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }))
  }
}
