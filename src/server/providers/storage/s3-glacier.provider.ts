import {
  S3Client,
  PutObjectCommand,
  CopyObjectCommand,
  DeleteObjectCommand,
  RestoreObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import type { IStorageProvider } from './storage.provider.interface'
import type { FileMetadata, RetrievalTier, RetrievalStatus, UploadTarget } from '../../types'

export class S3GlacierProvider implements IStorageProvider {
  private get s3() {
    return new S3Client({
      region: process.env.AWS_REGION ?? 'us-east-1',
      followRegionRedirects: true,
    })
  }
  private get bucket() { return process.env.AWS_S3_BUCKET ?? '' }

  private requireBucket(): string {
    if (!this.bucket) throw new Error('AWS_S3_BUCKET is not configured in environment variables')
    return this.bucket
  }

  buildKey(userId: string, vaultId: string, fileId: string): string {
    return `users/${userId}/vaults/${vaultId}/${fileId}`
  }

  async getUploadUrl(
    key: string,
    metadata: FileMetadata,
    expiresInSeconds = 900,
  ): Promise<UploadTarget> {
    // StorageClass is intentionally omitted here — x-amz-storage-class as a signed header
    // requires non-trivial CORS configuration and causes SignatureDoesNotMatch 403s in browsers.
    // transitionStorageClass() is called server-side after the client confirms the upload.
    const command = new PutObjectCommand({
      Bucket: this.requireBucket(),
      Key: key,
      ContentType: metadata.mimeType,
    })

    const uploadUrl = await getSignedUrl(this.s3, command, { expiresIn: expiresInSeconds })
    return {
      uploadUrl,
      key,
      expiresAt: new Date(Date.now() + expiresInSeconds * 1000),
      requiredHeaders: {},
    }
  }

  async transitionStorageClass(key: string, tier: 'cold' | 'hot'): Promise<void> {
    const bucket = this.requireBucket()
    const storageClass = tier === 'cold' ? 'DEEP_ARCHIVE' : 'STANDARD_IA'
    await this.s3.send(new CopyObjectCommand({
      Bucket: bucket,
      CopySource: `${bucket}/${key}`,
      Key: key,
      StorageClass: storageClass,
      MetadataDirective: 'COPY',
    }))
  }

  async initiateRetrieval(key: string, tier: RetrievalTier): Promise<string> {
    const restoreTier = tier === 'bulk' ? 'Bulk' : 'Standard'
    await this.s3.send(
      new RestoreObjectCommand({
        Bucket: this.requireBucket(),
        Key: key,
        RestoreRequest: { Days: 2, GlacierJobParameters: { Tier: restoreTier } },
      }),
    )
    // AWS does not return a job ID for S3 Glacier restore — key is the identifier
    return key
  }

  async getRetrievalStatus(key: string): Promise<RetrievalStatus> {
    const head = await this.s3.send(new HeadObjectCommand({ Bucket: this.requireBucket(), Key: key }))
    const restore = head.Restore ?? ''
    if (restore.includes('ongoing-request="true"')) return 'restoring'
    if (restore.includes('ongoing-request="false"')) return 'ready'
    return 'pending'
  }

  async getDownloadUrl(key: string, expiresInSeconds = 3600): Promise<string> {
    const { GetObjectCommand } = await import('@aws-sdk/client-s3')
    const command = new GetObjectCommand({ Bucket: this.requireBucket(), Key: key })
    return getSignedUrl(this.s3, command, { expiresIn: expiresInSeconds })
  }

  async putObject(key: string, body: Buffer, contentType: string, tier: 'cold' | 'hot'): Promise<void> {
    await this.s3.send(new PutObjectCommand({
      Bucket: this.requireBucket(),
      Key: key,
      Body: body,
      ContentType: contentType,
      StorageClass: tier === 'cold' ? 'DEEP_ARCHIVE' : 'STANDARD_IA',
    }))
  }

  async deleteObject(key: string): Promise<void> {
    await this.s3.send(new DeleteObjectCommand({ Bucket: this.requireBucket(), Key: key }))
  }
}
