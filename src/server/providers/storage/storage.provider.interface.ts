import type { Readable } from 'stream'
import type { FileMetadata, RetrievalTier, RetrievalStatus, StorageTier, UploadTarget } from '../../types'

export interface IStorageProvider {
  /** Generate a pre-signed URL for direct client upload */
  getUploadUrl(key: string, metadata: FileMetadata, expiresInSeconds?: number): Promise<UploadTarget>

  /**
   * Transition an already-uploaded object to the correct storage class.
   * Called server-side after upload confirmation — avoids needing x-amz-storage-class
   * as a signed header in the presigned URL (which complicates browser CORS).
   */
  transitionStorageClass(key: string, tier: StorageTier): Promise<void>

  /** Initiate a Glacier restore job; returns the AWS job ID */
  initiateRetrieval(key: string, tier: RetrievalTier): Promise<string>

  /** Poll the status of an ongoing restore job */
  getRetrievalStatus(key: string): Promise<RetrievalStatus>

  /** Generate a pre-signed download URL once an object is restored */
  getDownloadUrl(key: string, expiresInSeconds?: number): Promise<string>

  /** Upload object content directly (server-side, bypasses CORS) */
  putObject(key: string, body: Buffer, contentType: string, tier: 'cold' | 'hot'): Promise<void>

  /** Stream object content directly to S3 without buffering to disk */
  putObjectFromStream(key: string, stream: Readable, contentType: string, sizeBytes: number, tier: 'cold' | 'hot'): Promise<void>

  /** Delete an object from storage */
  deleteObject(key: string): Promise<void>

  /** Build the S3 object key for a given user/vault/file */
  buildKey(userId: string, vaultId: string, fileId: string): string
}
