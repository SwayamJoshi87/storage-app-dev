import { eq } from 'drizzle-orm'
import { db } from '@/db/client'
import { vaults } from '@/db/schema/vaults'
import type { Vault, NewVault } from '@/db/schema/vaults'
import type { IVaultRepository } from '../interfaces/vault.repository.interface'

export class DrizzleVaultRepository implements IVaultRepository {
  async findById(id: string): Promise<Vault | null> {
    const rows = await db.select().from(vaults).where(eq(vaults.id, id)).limit(1)
    return rows[0] ?? null
  }

  async findByUserId(userId: string): Promise<Vault[]> {
    return db
      .select()
      .from(vaults)
      .where(eq(vaults.userId, userId))
      .orderBy(vaults.createdAt)
  }

  async create(vault: NewVault): Promise<Vault> {
    const rows = await db.insert(vaults).values(vault).returning()
    return rows[0]
  }

  async update(id: string, data: Partial<Vault>): Promise<Vault> {
    const rows = await db
      .update(vaults)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(vaults.id, id))
      .returning()
    return rows[0]
  }

  async delete(id: string): Promise<void> {
    await db.delete(vaults).where(eq(vaults.id, id))
  }
}
