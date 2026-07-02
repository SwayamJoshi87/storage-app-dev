import type { File, NewFile } from '@/db/schema/files'

export interface IFileRepository {
  findById(id: string): Promise<File | null>
  findByVaultId(vaultId: string): Promise<File[]>
  findByUserId(userId: string): Promise<File[]>
  /** Return all files imported from Google Drive for this user, newest first */
  findGoogleDriveImportsByUserId(userId: string): Promise<File[]>
  /** Return all files imported from OneDrive for this user, newest first */
  findOneDriveImportsByUserId(userId: string): Promise<File[]>
  create(file: NewFile): Promise<File>
  update(id: string, data: Partial<File>): Promise<File>
  delete(id: string): Promise<void>
  sumStorageByUserId(userId: string): Promise<{ coldBytes: number; hotBytes: number }>
}
