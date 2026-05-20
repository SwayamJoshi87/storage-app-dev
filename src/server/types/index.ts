export type StorageTier = 'hot' | 'cold'

export type RetrievalTier = 'bulk' | 'standard'

export type RetrievalStatus = 'pending' | 'restoring' | 'ready' | 'expired'

export type MigrationSource = 'gdrive' | 'onedrive'

export type MigrationStatus = 'queued' | 'running' | 'completed' | 'failed'

export interface FileMetadata {
  userId: string
  vaultId: string
  fileId: string
  originalName: string
  mimeType: string
  sizeBytes: number
  tier: StorageTier
}

export interface UploadTarget {
  uploadUrl: string
  key: string
  expiresAt: Date
  /** Headers the browser must include in the PUT request to satisfy the pre-signed signature */
  requiredHeaders: Record<string, string>
}

export interface RetrievalJob {
  jobId: string
  fileId: string
  status: RetrievalStatus
  downloadUrl?: string
  expiresAt?: Date
}
