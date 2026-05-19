import type { FileMetadata, RetrievalTier, RetrievalStatus, UploadTarget } from '../../types'

export interface IStorageProvider {
  /** Generate a pre-signed URL for direct client upload */
  getUploadUrl(key: string, metadata: FileMetadata, expiresInSeconds?: number): Promise<UploadTarget>

  /** Initiate a Glacier restore job; returns the AWS job ID */
  initiateRetrieval(key: string, tier: RetrievalTier): Promise<string>

  /** Poll the status of an ongoing restore job */
  getRetrievalStatus(key: string): Promise<RetrievalStatus>

  /** Generate a pre-signed download URL once an object is restored */
  getDownloadUrl(key: string, expiresInSeconds?: number): Promise<string>

  /** Delete an object from storage */
  deleteObject(key: string): Promise<void>

  /** Build the S3 object key for a given user/vault/file */
  buildKey(userId: string, vaultId: string, fileId: string): string
}
