import { eq, and, sum, isNotNull, desc } from 'drizzle-orm'
import { db } from '@/db/client'
import { files } from '@/db/schema/files'
import type { File, NewFile } from '@/db/schema/files'
import type { IFileRepository } from '../interfaces/file.repository.interface'

export class DrizzleFileRepository implements IFileRepository {
  async findById(id: string): Promise<File | null> {
    const rows = await db.select().from(files).where(eq(files.id, id)).limit(1)
    return rows[0] ?? null
  }

  async findByVaultId(vaultId: string): Promise<File[]> {
    return db
      .select()
      .from(files)
      .where(and(eq(files.vaultId, vaultId), eq(files.status, 'active')))
      .orderBy(files.createdAt)
  }

  async findByUserId(userId: string): Promise<File[]> {
    return db.select().from(files).where(eq(files.userId, userId)).orderBy(files.createdAt)
  }

  async findGoogleDriveImportsByUserId(userId: string): Promise<File[]> {
    return db
      .select()
      .from(files)
      .where(and(eq(files.userId, userId), isNotNull(files.googleDriveFileId)))
      .orderBy(desc(files.createdAt))
      .limit(100)
  }

  async findOneDriveImportsByUserId(userId: string): Promise<File[]> {
    return db
      .select()
      .from(files)
      .where(and(eq(files.userId, userId), isNotNull(files.onedriveDriveItemId)))
      .orderBy(desc(files.createdAt))
      .limit(100)
  }

  async create(file: NewFile): Promise<File> {
    const rows = await db.insert(files).values(file).returning()
    return rows[0]
  }

  async update(id: string, data: Partial<File>): Promise<File> {
    const rows = await db
      .update(files)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(files.id, id))
      .returning()
    return rows[0]
  }

  async delete(id: string): Promise<void> {
    await db.update(files).set({ status: 'deleted', updatedAt: new Date() }).where(eq(files.id, id))
  }

  async sumStorageByUserId(userId: string): Promise<{ coldBytes: number; hotBytes: number }> {
    const [cold] = await db
      .select({ total: sum(files.sizeBytes) })
      .from(files)
      .where(and(eq(files.userId, userId), eq(files.tier, 'cold'), eq(files.status, 'active')))

    const [hot] = await db
      .select({ total: sum(files.sizeBytes) })
      .from(files)
      .where(and(eq(files.userId, userId), eq(files.tier, 'hot'), eq(files.status, 'active')))

    return {
      coldBytes: Number(cold?.total ?? 0),
      hotBytes: Number(hot?.total ?? 0),
    }
  }
}
